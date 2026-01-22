import fitz  # PyMuPDF
import tkinter as tk
from tkinter import simpledialog, filedialog, messagebox, Canvas, Scrollbar
from PIL import Image, ImageTk
from pathlib import Path
import io

# --- Configuration ---
SAVE_FOLDER = Path("C:\\Users\\bhoge\\OneDrive\\Documents\\Desktop\\QPG\\backend\\data\\data_structure\\CET\\11\\Physics\\10. Error Analysis")
FILENAME_PREFIX = ""

# --- Setup ---
SAVE_FOLDER.mkdir(parents=True, exist_ok=True)

class PDFCropperApp:
    def __init__(self, root):
        self.root = root
        self.root.title("PDF Screenshot Tool (Scroll to read, Drag to crop)")
        self.root.geometry("1200x800")

        # Configuration State
        self.doc = None
        self.current_page_num = 0
        self.total_pages = 0
        self.tk_image = None  # Keep reference
        self.pil_image = None
        self.zoom_level = 1.5  # Initial zoom

        # UI Components
        self.create_widgets()

        # Canvas State
        self.rect_id = None
        self.start_x = None
        self.start_y = None

        # Load PDF immediately
        self.root.after(100, self.load_pdf)

    def create_widgets(self):
        # Toolbar
        toolbar = tk.Frame(self.root, bd=1, relief=tk.RAISED)
        toolbar.pack(side=tk.TOP, fill=tk.X)

        btn_open = tk.Button(toolbar, text="Open PDF", command=self.load_pdf)
        btn_open.pack(side=tk.LEFT, padx=5, pady=5)

        self.btn_prev = tk.Button(toolbar, text="<< Prev Page", command=self.prev_page, state=tk.DISABLED)
        self.btn_prev.pack(side=tk.LEFT, padx=5)

        self.lbl_page = tk.Label(toolbar, text="Page: 0/0")
        self.lbl_page.pack(side=tk.LEFT, padx=5)

        self.btn_next = tk.Button(toolbar, text="Next Page >>", command=self.next_page, state=tk.DISABLED)
        self.btn_next.pack(side=tk.LEFT, padx=5)

        # Scrollable Canvas
        frame_canvas = tk.Frame(self.root)
        frame_canvas.pack(fill=tk.BOTH, expand=True)

        self.v_scroll = Scrollbar(frame_canvas, orient=tk.VERTICAL)
        self.h_scroll = Scrollbar(frame_canvas, orient=tk.HORIZONTAL)

        self.canvas = Canvas(frame_canvas, bg="gray", 
                             yscrollcommand=self.v_scroll.set, 
                             xscrollcommand=self.h_scroll.set)
        
        self.v_scroll.config(command=self.canvas.yview)
        self.h_scroll.config(command=self.canvas.xview)

        self.v_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.h_scroll.pack(side=tk.BOTTOM, fill=tk.X)
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Bindings
        self.canvas.bind("<ButtonPress-1>", self.on_button_press)
        self.canvas.bind("<B1-Motion>", self.on_move_press)
        self.canvas.bind("<ButtonRelease-1>", self.on_button_release)
        
        # Mouse Wheel Scrolling
        self.canvas.bind("<MouseWheel>", self.on_mousewheel)  # Windows
        self.canvas.bind("<Shift-MouseWheel>", self.on_shift_mousewheel) # Horizontal

        # Keyboard Navigation
        self.root.bind("<Left>", lambda e: self.prev_page())
        self.root.bind("<Right>", lambda e: self.next_page())

    def on_mousewheel(self, event):
        self.canvas.yview_scroll(int(-1*(event.delta/120)), "units")

    def on_shift_mousewheel(self, event):
        self.canvas.xview_scroll(int(-1*(event.delta/120)), "units")

    def load_pdf(self):
        file_path = filedialog.askopenfilename(
            title="Select PDF File",
            filetypes=[("PDF Files", "*.pdf")]
        )
        if not file_path:
            return
        
        try:
            self.doc = fitz.open(file_path)
            self.total_pages = len(self.doc)
            self.current_page_num = 0
            self.show_page()
            self.update_nav_buttons()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load PDF: {e}")

    def show_page(self):
        if not self.doc: return
        
        try:
            page = self.doc.load_page(self.current_page_num)
            mat = fitz.Matrix(self.zoom_level, self.zoom_level)
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL
            # PyMuPDF pymap to image
            # pix.samples is bytes
            img_mode = "RGB" if pix.alpha == 0 else "RGBA"
            img_data = pix.tobytes("ppm") # Safe generic format
            self.pil_image = Image.open(io.BytesIO(img_data))
            self.tk_image = ImageTk.PhotoImage(self.pil_image)
            
            # Update Canvas
            self.canvas.delete("all")
            self.canvas.config(scrollregion=(0, 0, self.tk_image.width(), self.tk_image.height()))
            self.canvas.create_image(0, 0, image=self.tk_image, anchor=tk.NW)
            
            self.lbl_page.config(text=f"Page: {self.current_page_num + 1}/{self.total_pages}")

        except Exception as e:
            print(f"Render error: {e}")

    def update_nav_buttons(self):
        self.btn_prev.config(state=tk.NORMAL if self.current_page_num > 0 else tk.DISABLED)
        self.btn_next.config(state=tk.NORMAL if self.current_page_num < self.total_pages - 1 else tk.DISABLED)

    def next_page(self):
        if self.current_page_num < self.total_pages - 1:
            self.current_page_num += 1
            self.show_page()
            self.update_nav_buttons()

    def prev_page(self):
        if self.current_page_num > 0:
            self.current_page_num -= 1
            self.show_page()
            self.update_nav_buttons()

    # --- Cropping Logic ---
    def on_button_press(self, event):
        # Save start coordinates on the canvas (absolute)
        self.start_x = self.canvas.canvasx(event.x)
        self.start_y = self.canvas.canvasy(event.y)
        
        if self.rect_id:
            self.canvas.delete(self.rect_id)
        self.rect_id = self.canvas.create_rectangle(self.start_x, self.start_y, self.start_x, self.start_y, outline="red", width=2)

    def on_move_press(self, event):
        cur_x = self.canvas.canvasx(event.x)
        cur_y = self.canvas.canvasy(event.y)
        self.canvas.coords(self.rect_id, self.start_x, self.start_y, cur_x, cur_y)

    def on_button_release(self, event):
        end_x = self.canvas.canvasx(event.x)
        end_y = self.canvas.canvasy(event.y)
        
        # Calculate Box
        x1 = min(self.start_x, end_x)
        y1 = min(self.start_y, end_y)
        x2 = max(self.start_x, end_x)
        y2 = max(self.start_y, end_y)
        
        # Threshold
        if (x2 - x1) < 10 or (y2 - y1) < 10:
            self.canvas.delete(self.rect_id)
            return
            
        self.save_crop(x1, y1, x2, y2)
        self.canvas.delete(self.rect_id)

    def save_crop(self, x1, y1, x2, y2):
        q_num = simpledialog.askstring("Input", "Enter Question Number (e.g., 5, 5a):", parent=self.root)
        
        if q_num:
            filename = f"{FILENAME_PREFIX}{q_num}.png"
            filepath = SAVE_FOLDER / filename
            
            if filepath.exists():
                if not messagebox.askyesno("Overwrite?", f"{filename} exists. Overwrite?"):
                    return

            try:
                # Crop from PIL image
                crop_img = self.pil_image.crop((x1, y1, x2, y2))
                crop_img.save(filepath)
                print(f"Saved: {filepath}")
                # Optional: Show a quick feedback label or message
                self.root.title(f"PDF Screenshot Tool - Saved: {filename}")
                self.root.focus_set() 
            except Exception as e:
                messagebox.showerror("Error", f"Could not save: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = PDFCropperApp(root)
    root.mainloop()
