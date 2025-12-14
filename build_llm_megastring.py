import os
import time
import pyperclip
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Config
PATH_LIST_FILE = "LLM_MEGASTRING_SOURCES.txt"
SEPARATOR = "\n" + "="*50 + "\n"
DEBOUNCE_SECONDS = 0.5  # Prevent multiple triggers on single save


def read_paths_list(file_path):
  with open(file_path, "r", encoding="utf-8") as f:
    return [line.strip() for line in f if line.strip()]


def read_file_content(file_path):
  """Read file as text; skip if binary or unreadable."""
  try:
    with open(file_path, "r", encoding="utf-8") as f:
      return f.read()
  except UnicodeDecodeError:
    print(f"Skipping binary file: {file_path}")
    return None
  except Exception as e:
    print(f"Failed to read {file_path}: {e}")
    return None


def gather_files(paths):
  all_files = []
  for path in paths:
    abs_path = os.path.abspath(path)
    if os.path.isfile(abs_path):
      all_files.append(abs_path)
    elif os.path.isdir(abs_path):
      for root, _, files in os.walk(abs_path):
        for file in files:
          all_files.append(os.path.join(root, file))
    else:
      print(f"Path not found: {abs_path}")
  return all_files


def build_mega_string(file_paths):
  mega_string = ""
  included_files = []
  for file_path in file_paths:
    content = read_file_content(file_path)
    if content is not None:
      mega_string += f"File: {file_path}{SEPARATOR}{content}{SEPARATOR}"
      included_files.append(file_path)
      print(f"Including: {file_path}")
  return mega_string, included_files


def run_megastring_build():
  print("\n[INFO] Rebuilding mega string...")
  paths = read_paths_list(PATH_LIST_FILE)
  files = gather_files(paths)
  mega_string, included_files = build_mega_string(files)
  pyperclip.copy(mega_string)
  print(f"[INFO] Mega string copied to clipboard. Total included files: {len(included_files)}")


class FileChangeHandler(FileSystemEventHandler):
  def __init__(self, cooldown=DEBOUNCE_SECONDS):
    super().__init__()
    self.cooldown = cooldown
    self.last_event_time = 0

  def on_modified(self, event):
    if os.path.abspath(event.src_path) == os.path.abspath(PATH_LIST_FILE):
      now = time.time()
      if now - self.last_event_time > self.cooldown:
        self.last_event_time = now
        run_megastring_build()


if __name__ == "__main__":
  # Initial build
  run_megastring_build()

  # Set up watchdog observer
  event_handler = FileChangeHandler()
  observer = Observer()
  observer.schedule(event_handler, path=os.path.dirname(os.path.abspath(PATH_LIST_FILE)) or ".", recursive=False)
  observer.start()
  print(f"[INFO] Watching '{PATH_LIST_FILE}' for changes. Press Ctrl+C to stop.")

  try:
    while True:
      time.sleep(1)
  except KeyboardInterrupt:
    observer.stop()
  observer.join()
