import json
import re
import os
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
import datetime
from pathlib import Path

# --- Configuration ---
# Default paths (can be changed in GUI)
DEFAULT_JSON_ROOT = r"C:\BisugenTech\Projects\01_Paper-Nest\backend\data\data"
DEFAULT_IMAGE_ROOT = r"C:\BisugenTech\Projects\01_Paper-Nest\backend\data\Questions_Image_Data"

# --- Logic Class ---
class ImageMapper:
    def __init__(self, json_path=None):
        self.json_path = Path(json_path) if json_path else None
        self.data = []
        if self.json_path:
            self.load_data()

    def set_json_path(self, json_path):
        self.json_path = Path(json_path)
        return self.load_data()

    def load_data(self):
        """Loads JSON data from the file."""
        if not self.json_path or not self.json_path.exists():
            self.data = []
            return False, f"File not found: {self.json_path}"
        
        try:
            with open(self.json_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            return True, "Data loaded successfully."
        except json.JSONDecodeError as e:
            return False, f"JSON Decode Error in {self.json_path.name}: {e}"
        except Exception as e:
            return False, f"Error loading file {self.json_path.name}: {e}"

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
                return False, f"Not found: {name_to_store} in ID {q_id}"
        else:
            # Add mode
            if name_to_store in current_list:
                return False, f"Duplicate: {name_to_store} already exists in ID {q_id}."
            
            if not dry_run:
                current_list.append(name_to_store)
                # Sort the list based on the trailing number
                def sort_key(s):
                    # Extract last number from string q..._..._{num}
                    m = re.search(r"_(\d+)\.[a-zA-Z]+$", s) # match at end with extension
                    if not m:
                         m = re.search(r"_(\d+)$", Path(s).stem) # fallback to stem
                    return int(m.group(1)) if m else 0
                
                current_list.sort(key=sort_key)
                
            return True, f"Added {name_to_store} to ID {q_id} ({category})"

    def save_json(self):
        """Saves current memory data to file."""
        if not self.json_path:
            return False, "No JSON path set."
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
        self.root.title("Auto Image Mapper - Batch Edition")
        self.root.geometry("900x700")
        
        self.mapper = ImageMapper()
        
        self.setup_ui()

    def setup_ui(self):
        # 1. Configuration (Root Folders)
        frame_config = tk.LabelFrame(self.root, text="Global Configuration", padx=5, pady=5)
        frame_config.pack(fill="x", padx=10, pady=5)
        
        # Data Root
        tk.Label(frame_config, text="Data Root (JSON):").grid(row=0, column=0, sticky="w")
        self.entry_data_root = tk.Entry(frame_config, width=60)
        self.entry_data_root.insert(0, DEFAULT_JSON_ROOT)
        self.entry_data_root.grid(row=0, column=1, padx=5, pady=5)
        btn_browse_data = tk.Button(frame_config, text="Browse", command=lambda: self.browse_folder(self.entry_data_root))
        btn_browse_data.grid(row=0, column=2, padx=5)

        # Image Root
        tk.Label(frame_config, text="Image Root:").grid(row=1, column=0, sticky="w")
        self.entry_image_root = tk.Entry(frame_config, width=60)
        self.entry_image_root.insert(0, DEFAULT_IMAGE_ROOT)
        self.entry_image_root.grid(row=1, column=1, padx=5, pady=5)
        btn_browse_img = tk.Button(frame_config, text="Browse", command=lambda: self.browse_folder(self.entry_image_root))
        btn_browse_img.grid(row=1, column=2, padx=5)

        # 2. Actions (Tabs)
        import tkinter.ttk as ttk
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill="both", expand=True, padx=10, pady=5)

        # Tab 1: Batch Process (The new feature)
        tab_batch = tk.Frame(notebook)
        notebook.add(tab_batch, text="Batch Map All")
        self.setup_batch_tab(tab_batch)

        # Tab 2: Single File/Folder (Legacy-ish)
        tab_single = tk.Frame(notebook)
        notebook.add(tab_single, text="Single File Tool")
        self.setup_single_tab(tab_single)

        # 3. Log Area (Shared)
        self.log_area = scrolledtext.ScrolledText(self.root, height=15)
        self.log_area.pack(fill="both", expand=True, padx=10, pady=5)

        btn_export = tk.Button(self.root, text="Export Log", command=self.export_log)
        btn_export.pack(side="right", padx=10, pady=5)

    def setup_batch_tab(self, parent):
        frame_opts = tk.LabelFrame(parent, text="Batch Options", padx=5, pady=5)
        frame_opts.pack(fill="x", padx=10, pady=10)

        self.var_dry_run_batch = tk.BooleanVar(value=True)
        chk_dry = tk.Checkbutton(frame_opts, text="Dry Run (Scanning only, no save)", variable=self.var_dry_run_batch)
        chk_dry.pack(side="left", padx=10)

        btn_run_all = tk.Button(frame_opts, text="RUN BATCH MAPPING", command=self.run_batch_mapping, bg="#ddffdd", font=("Arial", 10, "bold"))
        btn_run_all.pack(side="left", padx=20)
        
        tk.Label(frame_opts, text="(Matches JSON filenames to Image folders automatically)").pack(side="left")

    def setup_single_tab(self, parent):
        # Legacy controls for specific file operations
        frame_single_config = tk.LabelFrame(parent, text="Single Target", padx=5, pady=5)
        frame_single_config.pack(fill="x", padx=10, pady=5)
        
        tk.Label(frame_single_config, text="Specific JSON File:").grid(row=0, column=0, sticky="w")
        self.entry_single_json = tk.Entry(frame_single_config, width=50)
        self.entry_single_json.grid(row=0, column=1, padx=5)
        btn_browse_file = tk.Button(frame_single_config, text="Browse", command=self.browse_file)
        btn_browse_file.grid(row=0, column=2, padx=5)

        tk.Label(frame_single_config, text="Specific Image Folder:").grid(row=1, column=0, sticky="w")
        self.entry_single_img = tk.Entry(frame_single_config, width=50)
        self.entry_single_img.grid(row=1, column=1, padx=5)
        btn_browse_folder = tk.Button(frame_single_config, text="Browse", command=lambda: self.browse_folder(self.entry_single_img))
        btn_browse_folder.grid(row=1, column=2, padx=5)

        # Single Image Processing
        frame_proc = tk.LabelFrame(parent, text="Process", padx=5, pady=5)
        frame_proc.pack(fill="x", padx=10, pady=5)

        self.var_dry_run_single = tk.BooleanVar(value=False)
        tk.Checkbutton(frame_proc, text="Dry Run", variable=self.var_dry_run_single).pack(side="left", padx=5)

        tk.Label(frame_proc, text="Image Name:").pack(side="left", padx=5)
        self.entry_single_img_name = tk.Entry(frame_proc, width=30)
        self.entry_single_img_name.pack(side="left", padx=5)
        
        tk.Button(frame_proc, text="Process Single Image", command=self.process_single_entry).pack(side="left", padx=5)
        tk.Button(frame_proc, text="Process Entire Folder", command=self.process_single_folder).pack(side="left", padx=5)


    def browse_folder(self, entry_widget):
        path = filedialog.askdirectory()
        if path:
            entry_widget.delete(0, tk.END)
            entry_widget.insert(0, path)

    def browse_file(self):
        path = filedialog.askopenfilename(filetypes=[("JSON Files", "*.json")])
        if path:
            self.entry_single_json.delete(0, tk.END)
            self.entry_single_json.insert(0, path)

    def log(self, message):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        self.log_area.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_area.see(tk.END)

    # --- Batch Logic ---
    def run_batch_mapping(self):
        data_root = Path(self.entry_data_root.get().strip())
        image_root = Path(self.entry_image_root.get().strip())
        dry_run = self.var_dry_run_batch.get()

        if not data_root.exists() or not image_root.exists():
            messagebox.showerror("Error", "Check that Data Root and Image Root paths exist.")
            return

        self.log(f"=== STARTED BATCH MAPPING (Dry Run: {dry_run}) ===")
        self.log(f"Data Source: {data_root}")
        self.log(f"Image Source: {image_root}")

        total_files = 0
        total_mapped = 0

        # Walk through the data root
        for json_file in data_root.rglob("*.json"):
            # Compute relative path to maintain structure if needed, or just strict name match
            # Strategy: Match string of JSON filename (minus extension) to folder name in corresponding structure?
            # Or simpler: Look for a folder in image_root that mostly matches the json filename.
            
            # 1. Determine expected image directory
            # We blindly search for a folder in image_root that contains the stem of the json file
            # e.g json: gravitation.json -> Look for folder "*gravitation*" or "3. Gravitation"
            
            # To do this efficiently, we can mirror the directory structure of data_root inside image_root?
            # User path: backend/data/data/CET/11/Physics/gravitation.json
            # Image path: backend/data/Questions_Image_Data/CET/11/Physics/3. Gravitation/
            
            # Relative path from root
            rel_path = json_file.relative_to(data_root).parent # e.g. CET/11/Physics
            candidate_img_base = image_root / rel_path
            
            if not candidate_img_base.exists():
                self.log(f"SKIPPING: No matching image base folder for {rel_path}")
                continue

            # Now find the specific chapter folder. 
            # Json Stem: "gravitation"
            # Candidate folders in .../Physics/: "1. Motion in Plane", "3. Gravitation", etc.
            
            json_stem = json_file.stem.lower() # gravitation
            target_img_dir = None
            
            for child in candidate_img_base.iterdir():
                if child.is_dir():
                    # Clean the child name: remove leading numbers, punctuation
                    # "3. Gravitation" -> "Gravitation"
                    # "10. Error Analysis" -> "Error Analysis"
                    
                    # Regex replacement to just get letters
                    clean_name = re.sub(r'^[0-9\.\s]+', '', child.name).lower().strip()
                    # Also replace underscores/spaces in json_stem if needed
                    
                    if clean_name == json_stem or clean_name.replace(' ', '_') == json_stem:
                        target_img_dir = child
                        break
            
            if not target_img_dir:
                 self.log(f"WARNING: Could not find chapter folder for {json_file.name} in {candidate_img_base}")
                 continue

            # Found a pair!
            self.log(f"MATCH: {json_file.name} <-> {target_img_dir.name}")
            
            # Process this pair
            self.process_pair(json_file, target_img_dir, dry_run)
            total_files += 1

        self.log(f"=== BATCH COMPLETE. Processed {total_files} JSON files. ===")
        messagebox.showinfo("Done", f"Batch processing complete.\nFiles touched: {total_files}")

    def process_pair(self, json_path, img_dir, dry_run):
        # 1. Load Data
        success, msg = self.mapper.set_json_path(json_path)
        if not success:
            self.log(f"  FAILED to load JSON: {msg}")
            return

        changes = 0
        img_files = [f for f in img_dir.iterdir() if f.suffix.lower() in {'.png', '.jpg', '.jpeg'}]
        
        if not img_files:
            self.log(f"  No images found in {img_dir.name}")
            return

        for img_path in img_files:
            parsed, error = self.mapper.parse_image_name(img_path.name)
            if error:
                # Log only if it looks like a relevant file, otherwise it might be unrelated noise
                # self.log(f"    Skip {img_path.name}: {error}")
                continue
            
            # Attempt update
            success, msg = self.mapper.update_entry(parsed, dry_run=dry_run)
            if success:
                # self.log(f"    {msg}") # Detailed logging can get spammy
                changes += 1
            else:
                # Maybe log duplicates only if verbose?
                # self.log(f"    Skip {img_path.name}: {msg}")
                pass

        if changes > 0:
            if not dry_run:
                save_success, save_msg = self.mapper.save_json()
                if save_success:
                    self.log(f"  -> SAVED {changes} changes to {json_path.name}")
                else:
                    self.log(f"  -> ERROR saving {json_path.name}: {save_msg}")
            else:
                self.log(f"  -> {changes} potential changes (DRY RUN)")
        else:
            self.log(f"  -> No changes needed.")


    # --- Single Logic (Legacy) ---
    def process_single_entry(self):
        json_path = self.entry_single_json.get().strip()
        img_name = self.entry_single_img_name.get().strip()
        
        if not json_path or not img_name:
            messagebox.showwarning("Input", "JSON path and Image Name required")
            return
            
        success, msg = self.mapper.set_json_path(json_path)
        if not success:
            self.log(f"Error: {msg}")
            return

        parsed, err = self.mapper.parse_image_name(img_name)
        if err:
            self.log(f"Parse Error: {err}")
            return
            
        success, msg = self.mapper.update_entry(parsed, dry_run=self.var_dry_run_single.get())
        self.log(msg)
        
        if success and not self.var_dry_run_single.get():
            self.mapper.save_json()

    def process_single_folder(self):
        json_path = self.entry_single_json.get().strip()
        img_folder = self.entry_single_img.get().strip()
        
        if not json_path or not img_folder:
             messagebox.showwarning("Input", "JSON path and Image Folder required")
             return

        # Reuse the pair processor logic basically
        self.process_pair(json_path, Path(img_folder), self.var_dry_run_single.get())


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
    root = tk.Tk()
    app = App(root)
    root.mainloop()
