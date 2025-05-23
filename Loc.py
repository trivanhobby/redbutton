import os
from pathlib import Path

def count_lines(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return len(f.readlines())
    except:
        return 0

def get_stats():
    # File extensions to track
    extensions = {'.js': 0, '.ts': 0, '.tsx': 0, '.css': 0, '.html': 0}
    file_counts = {'.js': 0, '.ts': 0, '.tsx': 0, '.css': 0, '.html': 0}
    
    # Folders to ignore
    ignore_folders = {'build', 'dist', 'public', 'node_modules', 'server/node_modules', 'server/dist'}
    
    total_lines = 0
    total_files = 0
    # Walk through directory tree
    for root, dirs, files in os.walk('.'):
        # Skip ignored folders
        dirs[:] = [d for d in dirs if d not in ignore_folders and not any(i in os.path.join(root, d) for i in ignore_folders)]
        
        for file in files:
            file_path = os.path.join(root, file)
            ext = Path(file).suffix.lower()
            
            if ext in extensions:
                lines = count_lines(file_path)
                extensions[ext] += lines
                file_counts[ext] += 1
                total_lines += lines
                total_files += 1

    # Print results
    print("\nLines of Code Statistics:")
    print("-" * 50)
    print(f"Total Lines: {total_lines}")
    print(f"Total Files: {total_files}")
    print("\nBreakdown by Extension:")
    print("-" * 50)
    for ext in extensions:
        if extensions[ext] > 0:
            print(f"{ext:5} Files: {file_counts[ext]:4} | Lines: {extensions[ext]:6}")

if __name__ == "__main__":
    print("Starting...")
    get_stats()
