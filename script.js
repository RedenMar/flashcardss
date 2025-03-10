document.addEventListener('DOMContentLoaded', () => {
    const setsContainer = document.getElementById("sets-container");
    const searchInput = document.getElementById("search"); 
    const addSetButton = document.getElementById("add-set");
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const studiedCount = document.getElementById("studied-count");
    const importButton = document.getElementById("import");
    const exportButton = document.getElementById("export");
    const homeBtn = document.getElementById("home");

    let flashcardSets = JSON.parse(localStorage.getItem("flashcardSets")) || [];
    let studiedFlashcards = JSON.parse(localStorage.getItem("studiedFlashcards")) || 0;
    studiedCount.textContent = studiedFlashcards;

    const isDarkMode = JSON.parse(localStorage.getItem("darkMode"));
if (isDarkMode) {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "🌙"; // Set to sun when dark mode is active
} else {
    darkModeToggle.textContent = "☀️"; // Set to moon when light mode is active
}

    function saveToLocalStorage() {
        localStorage.setItem("flashcardSets", JSON.stringify(flashcardSets));
        localStorage.setItem("studiedFlashcards", studiedFlashcards);
    }
    function renderSets(filter = "") {
        setsContainer.innerHTML = "";
        flashcardSets.forEach((set, index) => {
            if (set.title.toLowerCase().includes(filter.toLowerCase())) {
                const setElement = document.createElement("div");
                setElement.classList.add("flashcard-set");
                setElement.dataset.index = index;
    
                setElement.innerHTML = `
                    <button class="delete-set" data-index="${index}">Delete</button>
                    <button class="edit-set" data-index="${index}">Edit</button>
                    <img src="trnfolderr.png" alt="Set Icon" class="set-image">
                    <h3 class="set-title">${set.title}</h3>
                `;
    
                setsContainer.appendChild(setElement);
    
                // Add event listeners for Edit and Delete
                setElement.querySelector(".edit-set").addEventListener("click", (event) => {
                    event.stopPropagation();
                    editSetTitle(index, setElement);
                });
    
                setElement.querySelector(".delete-set").addEventListener("click", (event) => {
                    event.stopPropagation();
                    deleteSet(index);
                });
    
                setElement.addEventListener("click", () => openSet(index));
            }
        });
    }
    function deleteSet(index) {
        showConfirmationDialog("Are you sure you want to delete this set?", () => {
            flashcardSets.splice(index, 1); // Remove the selected set
            saveToLocalStorage(); // Save the updated list
            renderSets(); // Refresh the UI
        });
    }
    function editSetTitle(index, setElement) {
        const titleElement = setElement.querySelector(".set-title");
    
        // Create input field
        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.value = flashcardSets[index].title;
        inputField.classList.add("edit-input");
    
        // Replace title with input field
        setElement.replaceChild(inputField, titleElement);
        inputField.focus();
    
        // Save the new title when the user presses Enter or clicks away
        inputField.addEventListener("blur", saveTitle);
        inputField.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                saveTitle();
            }
        });
    
        function saveTitle() {
            let newTitle = inputField.value.trim();
            if (newTitle !== "") {
                flashcardSets[index].title = newTitle;
                saveToLocalStorage();
                renderSets(); // Re-render sets to update the UI
            }
        }
    }
    homeBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    searchInput.addEventListener("input", () => {
        renderSets(searchInput.value);
    });
    searchInput.addEventListener("focus", () => {
        searchInput.placeholder = ""; // Remove placeholder on focus
    });
    
    searchInput.addEventListener("blur", () => {
        searchInput.placeholder = "🔍| Search"; // Restore placeholder when focus is lost
    });
let draggedSet = null;
let placeholder = null;
let pressTimer;
let originalIndex = null;

document.addEventListener("mousedown", (event) => {
    const setElement = event.target.closest(".flashcard-set");
    if (!setElement) return;

    pressTimer = setTimeout(() => {
        setElement.classList.add("grabbable"); // Add grab cursor
        startDragging(setElement);
    }, 300); // Long-press duration
});

document.addEventListener("mouseup", () => {
    clearTimeout(pressTimer);
    if (draggedSet) stopDragging();
    
    document.querySelectorAll(".flashcard-set").forEach(set => {
        set.classList.remove("grabbable"); // Remove grab cursor
    });
});
function startDragging(setElement) {
    draggedSet = setElement;
    draggedSet.classList.add("dragging");
    originalIndex = [...setsContainer.children].indexOf(draggedSet);

    placeholder = document.createElement("div");
    placeholder.classList.add("flashcard-set", "placeholder");
    setsContainer.insertBefore(placeholder, draggedSet.nextSibling);

    document.addEventListener("mousemove", onDragMove);
}

function onDragMove(event) {
    event.preventDefault();
    if (!draggedSet) return;

    draggedSet.style.position = "absolute";
    draggedSet.style.zIndex = "1000";
    draggedSet.style.left = `${event.pageX - draggedSet.offsetWidth / 2}px`;
    draggedSet.style.top = `${event.pageY - draggedSet.offsetHeight / 2}px`;

    const closestSet = getClosestSet(event.clientX, event.clientY);
    
    if (closestSet && closestSet !== draggedSet && closestSet !== placeholder) {
        setsContainer.insertBefore(placeholder, closestSet);
    } 
    
    // 🟢 Fix: If dragging past all sets, move placeholder to the last position
    const lastSet = setsContainer.lastElementChild;
    if (!closestSet || event.clientX > lastSet.getBoundingClientRect().right) {
        setsContainer.appendChild(placeholder);
    }

    animateSetMovement();
}
function animateSetMovement() {
    document.querySelectorAll(".flashcard-set:not(.dragging)").forEach(set => {
        const rect = set.getBoundingClientRect();
        set.style.transition = "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
        set.style.transform = `translate(${rect.left - set.offsetLeft}px, ${rect.top - set.offsetTop}px)`;
    });

    setTimeout(() => {
        document.querySelectorAll(".flashcard-set").forEach(set => {
            set.style.transition = "";
            set.style.transform = "";
        });
    }, 300);
}

function stopDragging() {
    draggedSet.classList.remove("dragging");
    draggedSet.style.position = "";
    draggedSet.style.zIndex = "";
    draggedSet.style.left = "";
    draggedSet.style.top = "";

    if (placeholder) {
        setsContainer.insertBefore(draggedSet, placeholder);
        placeholder.remove();
    }

    draggedSet = null;
    saveSetOrder(); // Save new positions
    document.removeEventListener("mousemove", onDragMove);
}

function getClosestSet(x, y) {
    return [...setsContainer.querySelectorAll(".flashcard-set:not(.dragging)")].reduce((closest, set) => {
        const box = set.getBoundingClientRect();
        const offset = Math.abs(y - box.top) + Math.abs(x - box.left);
        return offset < closest.offset ? { offset, element: set } : closest;
    }, { offset: Number.POSITIVE_INFINITY }).element;
}
    function addSet() {
        showInputForm("Enter set name:", (title) => {
            if (title.trim() !== "") {
                flashcardSets.unshift({ title, flashcards: [] });
                saveToLocalStorage();
                renderSets(searchInput.value);
            }
        });
    }
    let lastScrollTop = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    let scrollTop = window.scrollY;

    if (scrollTop > lastScrollTop) {
        header.style.top = "-60px";
    } else {
        header.style.top = "0";
    }

    lastScrollTop = scrollTop;
});
function showInputForm(title, callback) {
    const existingModal = document.querySelector(".modal-overlay");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.classList.add("modal-overlay");
    modal.innerHTML = `
        <div class="set-input-form">
            <h3>${title}</h3>
            <input type="text" id="input-value" placeholder="Enter set name..." autocomplete="off">
            <div class="form-buttons">
                <button id="submit-input">Save</button>
                <button id="cancel-input">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const inputField = document.getElementById("input-value");
    const submitButton = document.getElementById("submit-input");

    // Save on Enter key press
    inputField.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission
            submitButton.click(); // Trigger the Save button
        }
    });

    submitButton.addEventListener("click", () => {
        const value = inputField.value.trim();
        if (value) {
            callback(value);
            modal.remove();
        }
    });

    document.getElementById("cancel-input").addEventListener("click", () => {
        modal.remove();
    });

    inputField.focus(); // Automatically focus the input
}
    
    function showConfirmationDialog(message, onConfirm) {
        const existingModal = document.querySelector(".modal-overlay");
        if (existingModal) existingModal.remove();
    
        const modal = document.createElement("div");
        modal.classList.add("modal-overlay");
        modal.innerHTML = `
            <div class="confirmation-box">
                <p>${message}</p>
                <div class="modal-buttons">
                    <button id="confirm-delete">Yes, Delete</button>
                    <button id="cancel-delete">Cancel</button>
                </div>
            </div>
        `;
    
        document.body.appendChild(modal);
    
        document.getElementById("confirm-delete").addEventListener("click", () => {
            onConfirm();
            modal.remove();
        });
    
        document.getElementById("cancel-delete").addEventListener("click", () => {
            modal.remove();
        });
    }
    function openSet(index) {
        localStorage.setItem("currentSetIndex", index);
        window.location.href = "flashcards.html";
    }

    addSetButton.addEventListener("click", addSet);

    darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    
    // Change the button icon
    darkModeToggle.textContent = isDark ? "🌙" : "☀️";

    // Save dark mode state
    localStorage.setItem("darkMode", JSON.stringify(isDark));
});

    exportButton.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(flashcardSets, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "flashcards.json";
        link.click();
    });

    importButton.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                flashcardSets = JSON.parse(e.target.result);
                saveToLocalStorage();
                renderSets(searchInput.value);
            } catch (error) {
                alert("Invalid file format");
            }
        };
        reader.readAsText(file);
    });

    renderSets();
});