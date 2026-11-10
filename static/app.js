const durations = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

let current_mode = "focus";
let seconds_left = durations[current_mode];
let interval_id = null;

const timer_display = document.getElementById("timer");
const start_button = document.getElementById("start");
const reset_button = document.getElementById("reset");
const mode_buttons = document.querySelectorAll(".mode");

function render_time() {
  const minutes = String(Math.floor(seconds_left / 60)).padStart(2, "0");
  const seconds = String(seconds_left % 60).padStart(2, "0");
  timer_display.textContent = minutes + ":" + seconds;
}

function stop_timer() {
  clearInterval(interval_id);
  interval_id = null;
  start_button.textContent = "Start";
}

function tick() {
  seconds_left--;
  render_time();
  if (seconds_left === 0) {
    stop_timer();
    alert("Hết giờ!");
  }
}

function switch_mode(mode) {
  stop_timer();
  current_mode = mode;
  seconds_left = durations[current_mode];
  mode_buttons.forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.mode === current_mode);
  });
  render_time();
}

start_button.addEventListener("click", function () {
  if (interval_id === null) {
    interval_id = setInterval(tick, 1000);
    start_button.textContent = "Pause";
  } else {
    stop_timer();
  }
});

reset_button.addEventListener("click", function () {
  switch_mode(current_mode);
});

mode_buttons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    switch_mode(btn.dataset.mode);
  });
});

const font_select = document.getElementById("font");
const bg_color_input = document.getElementById("bgColor");
const accent_color_input = document.getElementById("accentColor");
const text_color_input = document.getElementById("textColor");
const minute_inputs = {
  focus: document.getElementById("focusMin"),
  short: document.getElementById("shortMin"),
  long: document.getElementById("longMin"),
};

font_select.addEventListener("change", function () {
  document.body.style.fontFamily = font_select.value;
});

bg_color_input.addEventListener("input", function () {
  document.documentElement.style.setProperty("--bg", bg_color_input.value);
});

accent_color_input.addEventListener("input", function () {
  document.documentElement.style.setProperty("--accent", accent_color_input.value);
});

text_color_input.addEventListener("input", function () {
  document.documentElement.style.setProperty("--text", text_color_input.value);
});

Object.keys(minute_inputs).forEach(function (mode_key) {
  const input = minute_inputs[mode_key];

  input.addEventListener("change", function () {
    const minutes = Math.floor(Number(input.value));

    if (!(minutes >= 1 && minutes <= 180)) {
      input.value = durations[mode_key] / 60;
      return;
    }

    input.value = minutes;
    durations[mode_key] = minutes * 60;

    if (mode_key === current_mode && interval_id === null) {
      seconds_left = durations[current_mode];
      render_time();
    }
  });
});

const bg_grid = document.getElementById("bgGrid");
const bg_file_input = document.getElementById("bgFile");
const bg_message = document.getElementById("bgMsg");
const bg_video = document.getElementById("bgVideo");

let current_bg = null;

function highlight_active_bg() {
  const active_url = current_bg ? current_bg.url : "";
  bg_grid.querySelectorAll(".bg-item").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.url === active_url);
  });
}

function apply_background(bg) {
  current_bg = bg;

  if (bg && bg.type === "video") {
    document.body.style.backgroundImage = "";
    bg_video.src = bg.url;
    bg_video.style.display = "block";
    bg_video.play().catch(function () {});
  } else {
    bg_video.pause();
    bg_video.removeAttribute("src");
    bg_video.load();
    bg_video.style.display = "none";
    document.body.style.backgroundImage = bg ? 'url("' + bg.url + '")' : "";
  }

  try {
    localStorage.setItem("bg", JSON.stringify(bg));
  } catch (err) {}
  highlight_active_bg();
}

async function delete_background(bg, cell) {
  if (!confirm("Delete this background from the server?")) return;

  if (current_bg && current_bg.url === bg.url) apply_background(null);

  const thumb_video = cell.querySelector("video");
  if (thumb_video) {
    thumb_video.removeAttribute("src");
    thumb_video.load();
  }

  try {
    const res = await fetch("/api/backgrounds?name=" + encodeURIComponent(bg.name), {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    bg_message.textContent = "Deleted background";
  } catch (err) {
    bg_message.textContent = err.message;
  }
  await load_backgrounds();
}

function render_background_grid(backgrounds) {
  bg_grid.innerHTML = "";

  const none_cell = document.createElement("div");
  none_cell.className = "bg-cell";
  const none_btn = document.createElement("button");
  none_btn.type = "button";
  none_btn.className = "bg-item";
  none_btn.dataset.url = "";
  none_btn.textContent = "None";
  none_btn.addEventListener("click", function () {
    apply_background(null);
  });
  none_cell.appendChild(none_btn);
  bg_grid.appendChild(none_cell);

  backgrounds.forEach(function (bg) {
    const cell = document.createElement("div");
    cell.className = "bg-cell";

    const select_btn = document.createElement("button");
    select_btn.type = "button";
    select_btn.className = "bg-item";
    select_btn.dataset.url = bg.url;
    select_btn.title = bg.name;

    let thumbnail;
    if (bg.type === "video") {
      thumbnail = document.createElement("video");
      thumbnail.src = bg.url + "#t=0.5";
      thumbnail.muted = true;
      thumbnail.preload = "metadata";
    } else {
      thumbnail = document.createElement("img");
      thumbnail.src = bg.url;
      thumbnail.alt = bg.name;
      thumbnail.loading = "lazy";
    }
    select_btn.appendChild(thumbnail);
    select_btn.addEventListener("click", function () {
      apply_background(bg);
    });
    cell.appendChild(select_btn);

    if (bg.source === "upload") {
      const delete_btn = document.createElement("button");
      delete_btn.type = "button";
      delete_btn.className = "bg-remove";
      delete_btn.textContent = "×";
      delete_btn.title = "Delete this background";
      delete_btn.setAttribute("aria-label", "Delete this background");
      delete_btn.addEventListener("click", function () {
        delete_background(bg, cell);
      });
      cell.appendChild(delete_btn);
    }

    bg_grid.appendChild(cell);
  });

  highlight_active_bg();
}

async function load_backgrounds() {
  try {
    const res = await fetch("/api/backgrounds");
    const data = await res.json();
    render_background_grid(data.items);
  } catch (err) {
    bg_message.textContent = "Failed to connect to Go server (open localhost:8080)";
  }
}

bg_file_input.addEventListener("change", async function () {
  const file = bg_file_input.files[0];
  if (!file) return;

  bg_message.textContent = "Uploading...";
  const form_data = new FormData();
  form_data.append("file", file);

  try {
    const res = await fetch("/api/backgrounds", { method: "POST", body: form_data });
    const uploaded = await res.json();
    if (!res.ok) throw new Error(uploaded.error);
    await load_backgrounds();
    apply_background(uploaded);
    bg_message.textContent = "Background changed";
  } catch (err) {
    bg_message.textContent = err.message;
  }
  bg_file_input.value = "";
});

async function init_background() {
  await load_backgrounds();
  try {
    const saved_bg = JSON.parse(localStorage.getItem("bg"));
    if (saved_bg) apply_background(saved_bg);
  } catch (err) {}
}

const note_list = document.getElementById("noteList");
const add_note_button = document.getElementById("addNote");

let notes = [];

function save_notes() {
  try {
    localStorage.setItem("notes", JSON.stringify(notes));
  } catch (err) {}
}

function load_notes() {
  try {
    const saved_notes = JSON.parse(localStorage.getItem("notes"));
    if (Array.isArray(saved_notes)) {
      notes = saved_notes.map(function (note) {
        return {
          id: String(note.id),
          text: String(note.text || ""),
          todos: Array.isArray(note.todos) ? note.todos : [],
        };
      });
    }
  } catch (err) {}
}

function generate_id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function create_mini_button(label, title, class_name, on_click) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mini " + class_name;
  btn.textContent = label;
  btn.title = title;
  btn.setAttribute("aria-label", title);
  btn.addEventListener("click", on_click);
  return btn;
}

function add_todo(note, position) {
  note.todos.splice(position, 0, { text: "", done: false });
  save_notes();
  render_notes({ note_id: note.id, todo_index: position });
}

function render_notes(focus_target) {
  note_list.innerHTML = "";

  if (notes.length === 0) {
    const empty_message = document.createElement("p");
    empty_message.className = "notes-empty";
    empty_message.textContent = "No notes yet. Click + Note to create one.";
    note_list.appendChild(empty_message);
    return;
  }

  notes.forEach(function (note) {
    const card = document.createElement("div");
    card.className = "note";
    card.dataset.id = note.id;

    card.appendChild(
      create_mini_button("×", "Delete note", "note-del", function () {
        const has_content = note.text.trim() !== "" || note.todos.length > 0;
        if (has_content && !confirm("Delete this note?")) return;
        notes = notes.filter(function (n) {
          return n.id !== note.id;
        });
        save_notes();
        render_notes();
      })
    );

    const textarea = document.createElement("textarea");
    textarea.placeholder = "Write something...";
    textarea.value = note.text;
    textarea.addEventListener("input", function () {
      note.text = textarea.value;
      save_notes();
    });
    card.appendChild(textarea);

    note.todos.forEach(function (todo, index) {
      const row = document.createElement("div");
      row.className = "todo" + (todo.done ? " done" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!todo.done;
      checkbox.addEventListener("change", function () {
        todo.done = checkbox.checked;
        row.classList.toggle("done", todo.done);
        save_notes();
      });

      const text_input = document.createElement("input");
      text_input.type = "text";
      text_input.className = "todo-text";
      text_input.placeholder = "...";
      text_input.value = todo.text || "";
      text_input.addEventListener("input", function () {
        todo.text = text_input.value;
        save_notes();
      });
      text_input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          add_todo(note, index + 1);
        } else if (e.key === "Backspace" && text_input.value === "") {
          e.preventDefault();
          note.todos.splice(index, 1);
          save_notes();
          render_notes({ note_id: note.id, todo_index: index - 1 });
        }
      });

      row.appendChild(checkbox);
      row.appendChild(text_input);
      row.appendChild(
        create_mini_button("×", "Delete", "todo-del", function () {
          note.todos.splice(index, 1);
          save_notes();
          render_notes();
        })
      );
      card.appendChild(row);
    });

    card.appendChild(
      create_mini_button("+ Checkbox", "Add checkbox", "add-todo", function () {
        add_todo(note, note.todos.length);
      })
    );

    note_list.appendChild(card);
  });

  if (focus_target) {
    const card = note_list.querySelector('[data-id="' + focus_target.note_id + '"]');
    if (card) {
      if (focus_target.todo_index < 0) {
        card.querySelector("textarea").focus();
      } else {
        const todo_inputs = card.querySelectorAll(".todo-text");
        if (todo_inputs[focus_target.todo_index]) todo_inputs[focus_target.todo_index].focus();
      }
    }
  }
}

add_note_button.addEventListener("click", function () {
  notes.unshift({ id: generate_id(), text: "", todos: [] });
  save_notes();
  render_notes();
  const first_textarea = note_list.querySelector("textarea");
  if (first_textarea) first_textarea.focus();
});

render_time();
init_background();
load_notes();
render_notes();