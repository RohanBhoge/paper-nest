import json
import re
import os
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
import datetime
from pathlib import Path

# --- Configuration ---
JSON_FILE_PATH = r"C:\Users\bhoge\OneDrive\Documents\Desktop\QPG\backend\data\data\data\CET\11\Physics\Error_Analysis.json"

# --- Logic Class ---
class ImageMapper:
    def __init__(self, json_path):
        self.json_path = Path(json_path)
        self.data = []
        self.load_data()

    def load_data(self):
        """Loads JSON data from the file."""
        if not self.json_path.exists():
            # If file doesn't exist, we start with an empty list or handle error
            # For this script, we assume strict adherence to existence, but will handle gently.
            self.data = []
            return False, f"File not found: {self.json_path}"
        
        try:
            with open(self.json_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            return True, "Data loaded successfully."
        except json.JSONDecodeError as e:
            return False, f"JSON Decode Error: {e}"
        except Exception as e:
            return False, f"Error loading file: {e}"





    def parse_image_name(self, image_name_full):
        """
        Parses the image name using underscores as delimiters.
        Expected parts: [Prefix]ID_Type_Number
        Example: q34_qu_1 -> ID=34, Type=qu, Num=1
        Example: 34_qu_1 -> ID=34, Type=qu, Num=1
        Example: 38_soD -> ID=38, Type=so (suffix D context), Num=0
        """
        base_name = Path(image_name_full).stem
        parts = base_name.split('_')
        
        if len(parts) < 2:
            return None, "Invalid format (needs at least ID_Type)"

        # 1. Parse ID (Handle optional 'q' prefix)
        id_part = parts[0]
        if id_part.lower().startswith('q') and id_part[1:].isdigit():
            q_id = int(id_part[1:])
        elif id_part.isdigit():
            q_id = int(id_part)
        else:
            return None, f"Invalid ID format: {id_part}"

        # 2. Parse Type
        img_type_raw = parts[1] 
        
        # 3. Parse Number (Optional)
        img_num = 0
        if len(parts) > 2:
            num_part = parts[2]
            if num_part.isdigit():
                img_num = int(num_part)
        
        # Determine Category
        category = None
        if img_type_raw == 'qu':
            category = "question_images"
        elif img_type_raw.startswith('so'):
             # matches so, so1, soD, etc.
             category = "solution_images"
        elif img_type_raw.startswith('op'):
             category = "option_images"
        
        if not category:
             return None, f"Unknown image type code: {img_type_raw}"

        return {
            "full_name": image_name_full, # Store full name with extension
            "q_id": q_id,
            "type": img_type_raw,
            "category": category,
            "num": img_num
        }, None

    def get_category_from_type(self, img_type):
        if img_type == "qu":
            return "question_images"
        elif img_type == "so":
            return "solution_images"
        elif img_type.startswith("op"):
            return "option_images"
        return None

    def update_entry(self, parsed_info, dry_run=False, remove_mode=False):
        """Updates the JSON data in memory."""
        q_id = parsed_info['q_id']
        category = parsed_info['category']
        name_to_store = parsed_info['full_name']
        
        # Find the question object
        target_obj = next((item for item in self.data if item.get("id") == q_id), None)
        
        if not target_obj:
            return False, f"Question ID {q_id} not found in JSON."

        # Initialize list if missing
        if category not in target_obj:
            target_obj[category] = []
            
        current_list = target_obj[category]
        
        if remove_mode:
            if name_to_store in current_list:
                if not dry_run:
                    current_list.remove(name_to_store)
                return True, f"Removed {name_to_store} from ID {q_id} ({category})"
            else:
                return False, f"{name_to_store} not present in ID {q_id} ({category})"
        else:
            # Add mode
            if name_to_store in current_list:
                return False, f"Duplicate: {name_to_store} already exists in ID {q_id}."
            
            if not dry_run:
                current_list.append(name_to_store)
                # Sort the list based on the trailing number
                # We need to re-parse names in the list to sort correctly by number
                def sort_key(s):
                    # Extract last number from string q..._..._{num}
                    m = re.search(r"_(\d+)$", s)
                    return int(m.group(1)) if m else 0
                
                current_list.sort(key=sort_key)
                
            return True, f"Added {name_to_store} to ID {q_id} ({category})"

    def save_json(self):
        """Saves current memory data to file."""
        try:
            with open(self.json_path, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=4, ensure_ascii=False)
            return True, "File saved successfully."
        except Exception as e:
            return False, f"Error saving file: {e}"

# --- GUI Class ---
class App:
    def __init__(self, root):
        self.root = root
        self.root.title("Auto Image Mapper")
        self.root.geometry("800x600")
        
        self.mapper = ImageMapper(JSON_FILE_PATH)
        
        self.setup_ui()
        
        # Check if file exists immediately
        full_load, msg = self.mapper.load_data()
        self.log(msg)
        if not full_load:
            self.log("WARNING: JSON file not found or invalid at specified path. Please create it or check path.")

    def setup_ui(self):
        # 1. JSON Path Display
        frame_config = tk.LabelFrame(self.root, text="Configuration", padx=5, pady=5)
        frame_config.pack(fill="x", padx=10, pady=5)
        
        tk.Label(frame_config, text="JSON Path:").grid(row=0, column=0, sticky="w")
        self.entry_json_path = tk.Entry(frame_config, width=60)
        self.entry_json_path.insert(0, str(self.mapper.json_path))
        self.entry_json_path.config(state='readonly') # Hardcoded as requested
        self.entry_json_path.grid(row=0, column=1, padx=5, pady=5)
        
        # 2. Source Folder (for validation/batch)
        tk.Label(frame_config, text="Image Folder:").grid(row=1, column=0, sticky="w")
        self.entry_img_folder = tk.Entry(frame_config, width=60)
        self.entry_img_folder.grid(row=1, column=1, padx=5, pady=5)
        btn_browse = tk.Button(frame_config, text="Browse", command=self.browse_folder)
        btn_browse.grid(row=1, column=2, padx=5)

        # 3. Single Processing
        frame_single = tk.LabelFrame(self.root, text="Single Image Mode", padx=5, pady=5)
        frame_single.pack(fill="x", padx=10, pady=5)
        
        tk.Label(frame_single, text="Image Name:").grid(row=0, column=0, sticky="w")
        self.entry_img_name = tk.Entry(frame_single, width=40)
        self.entry_img_name.grid(row=0, column=1, padx=5)
        self.entry_img_name.bind('<Return>', lambda event: self.process_single())
        
        btn_process_single = tk.Button(frame_single, text="Process Single", command=self.process_single, bg="#ddffdd")
        btn_process_single.grid(row=0, column=2, padx=10)

        # 4. Batch Processing
        frame_batch = tk.LabelFrame(self.root, text="Batch Mode", padx=5, pady=5)
        frame_batch.pack(fill="x", padx=10, pady=5)
        
        btn_process_batch = tk.Button(frame_batch, text="Process All Images in Folder", command=self.process_batch, bg="#ddddff")
        btn_process_batch.pack(side="left", padx=10)

        # 5. Options
        frame_opts = tk.Frame(self.root)
        frame_opts.pack(fill="x", padx=10, pady=5)
        
        self.var_dry_run = tk.BooleanVar(value=False)
        chk_dry = tk.Checkbutton(frame_opts, text="Dry Run (Preview Only)", variable=self.var_dry_run)
        chk_dry.pack(side="left", padx=10)
        
        self.var_remove = tk.BooleanVar(value=False)
        chk_remove = tk.Checkbutton(frame_opts, text="Remove Mode (Delete instead of Add)", variable=self.var_remove)
        chk_remove.pack(side="left", padx=10)

        # 6. Actions
        frame_actions = tk.Frame(self.root)
        frame_actions.pack(fill="x", padx=10, pady=5)
        

        
        btn_export = tk.Button(frame_actions, text="Export Log", command=self.export_log)
        btn_export.pack(side="right", padx=10)

        # 7. Log
        self.log_area = scrolledtext.ScrolledText(self.root, height=15)
        self.log_area.pack(fill="both", expand=True, padx=10, pady=5)

    def browse_folder(self):
        path = filedialog.askdirectory()
        if path:
            self.entry_img_folder.delete(0, tk.END)
            self.entry_img_folder.insert(0, path)

    def log(self, message):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        self.log_area.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_area.see(tk.END)

    def validate_file_exists(self, filename):
        folder = self.entry_img_folder.get().strip()
        if not folder:
            return True # If no folder specified, skip validation or assume valid? 
            # Prompt says: "Validate that image file actually exists in a specified folder"
            # If no folder is specified, we can't ignore it if we want to be strict, but for single entry
            # w/o folder selected, maybe we shouldn't block.
            # Let's return True if folder is empty (assume user knows), but log warning?
            # Or treat as "Can't validate".
        
        path = Path(folder) / filename
        if path.exists():
            return True
        return False

    def process_logic(self, image_names, auto_save=True):
        """
        Generic processor for a list of image names.
        """
        # 0. Reload data to be fresh
        success, msg = self.mapper.load_data()
        if not success:
            self.log(f"CRITICAL: {msg}")
            return



        changes_made = 0
        errors = 0
        
        remove_mode = self.var_remove.get()
        dry_run = self.var_dry_run.get()
        
        action_word = "REMOVING" if remove_mode else "ADDING"
        if dry_run: action_word = f"DRY-RUN {action_word}"

        self.log(f"--- Started {action_word} {len(image_names)} images ---")

        for img_name in image_names:
            # Validate existence if folder is set
            folder = self.entry_img_folder.get().strip()
            if folder and not remove_mode: # Only check existence on add
                 if not self.validate_file_exists(img_name):
                     self.log(f"SKIP: {img_name} not found in {folder}")
                     errors += 1
                     continue

            parsed, error = self.mapper.parse_image_name(img_name)
            if error:
                self.log(f"SKIP: {img_name} - {error}")
                errors += 1
                continue
            
            success, msg = self.mapper.update_entry(parsed, dry_run=dry_run, remove_mode=remove_mode)
            if success:
                self.log(f"OK: {msg}")
                changes_made += 1
            else:
                self.log(f"FAIL: {msg}")
                errors += 1

        # Save
        if changes_made > 0 and not dry_run and auto_save:
            save_success, save_msg = self.mapper.save_json()
            if save_success:
                self.log(f"SUCCESS: JSON saved. {changes_made} changes.")
                messagebox.showinfo("Result", f"Processed {len(image_names)} items.\nChanges: {changes_made}\nErrors/Skips: {errors}")
            else:
                self.log(f"ERROR: Could not save JSON: {save_msg}")
        elif dry_run:
            self.log(f"Dry run complete. No files saved.")
            messagebox.showinfo("Dry Run", f"Would make {changes_made} changes.\nErrors/Skips: {errors}")
        else:
            self.log("No changes made.")
            if errors > 0:
                messagebox.showwarning("Result", "No changes made, but check log for errors.")

    def process_single(self):
        raw_name = self.entry_img_name.get().strip()
        if not raw_name:
            messagebox.showwarning("Input", "Please enter an image name.")
            return
        
        self.process_logic([raw_name])

    def process_batch(self):
        folder = self.entry_img_folder.get().strip()
        if not folder:
            messagebox.showwarning("Input", "Please select an Image Folder first.")
            return
        
        if not os.path.exists(folder):
            messagebox.showerror("Error", "Selected folder does not exist.")
            return

        valid_exts = {'.png', '.jpg', '.jpeg'}
        files = [f for f in os.listdir(folder) if Path(f).suffix.lower() in valid_exts]
        
        if not files:
            self.log("No valid images found in folder.")
            return
            
        should_continue = messagebox.askyesno("Confirm Batch", f"Found {len(files)} images. Proceed?")
        if should_continue:
            self.process_logic(files)



    def export_log(self):
        content = self.log_area.get("1.0", tk.END)
        path = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=[("Text Files", "*.txt")])
        if path:
            try:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.log(f"Log exported to {path}")
            except Exception as e:
                messagebox.showerror("Export Error", str(e))

if __name__ == "__main__":
    if not os.path.exists(os.path.dirname(JSON_FILE_PATH)):
       # Optional: create directory if it strictly must exist, or just warn.
       # print(f"Warning: Directory {os.path.dirname(JSON_FILE_PATH)} does not exist.")
       pass

    root = tk.Tk()
    app = App(root)
    root.mainloop()
