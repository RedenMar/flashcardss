document.addEventListener("DOMContentLoaded", () => {
    const flashcardsContainer = document.getElementById("flashcards-container");
    const shuffleButton = document.getElementById("shuffle-cards");
    const setTitle = document.getElementById("set-title");
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const startQuizButton = document.getElementById("start-quiz");
    const quizModal = document.getElementById("quiz-modal");
    const quizCard = document.querySelector(".quiz-card");
    const quizQuestion = document.getElementById("quiz-question");
    const quizAnswerText = document.getElementById("quiz-answer-text");
    const quizInput = document.getElementById("quiz-input");
    const quizSubmit = document.getElementById("quiz-submit");
    const quizNext = document.getElementById("quiz-next");
    const quizClose = document.getElementById("quiz-close");
    
    let quizIndex = 0;
    let flashcardSets = JSON.parse(localStorage.getItem("flashcardSets")) || [];
    let setIndex = localStorage.getItem("currentSetIndex");

    if (setIndex === null) {
        alert("No set selected!");
        window.location.href = "FlashcardProj.html";
        return;
    }
    let draggedFlashcard = null;
    let pressTimer;

    document.addEventListener("mousedown", (event) => {
        const flashcard = event.target.closest(".flashcard");
        if (!flashcard) return;

        pressTimer = setTimeout(() => {
            draggedFlashcard = flashcard;
            draggedFlashcard.setAttribute("draggable", "true");
        }, 500); // 500ms long press
    });

    document.addEventListener("mouseup", () => {
        clearTimeout(pressTimer);
        if (draggedFlashcard) {
            draggedFlashcard.removeAttribute("draggable");
            draggedFlashcard = null;
        }
    });

    flashcardsContainer.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    flashcardsContainer.addEventListener("drop", (event) => {
        event.preventDefault();
        if (draggedFlashcard) {
            const afterElement = getDragAfterElement(flashcardsContainer, event.clientY);
            if (afterElement == null) {
                flashcardsContainer.appendChild(draggedFlashcard);
            } else {
                flashcardsContainer.insertBefore(draggedFlashcard, afterElement);
            }
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(".flashcard:not([draggable='true'])")];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    setIndex = parseInt(setIndex);
    setTitle.textContent = flashcardSets[setIndex].title;
    const isDarkMode = JSON.parse(localStorage.getItem("darkMode"));
    if (isDarkMode) {
        document.body.classList.add("dark-mode");
    }
    function renderFlashcards() {
        flashcardsContainer.innerHTML = "";
        
        flashcardSets[setIndex].flashcards.forEach((flashcard, i) => {
            const card = document.createElement("div");
            card.classList.add("flashcard");
            
            card.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <p>${flashcard.question}</p>
                    </div>
                    <div class="flashcard-back">
                        <p>${Array.isArray(flashcard.answer) ? flashcard.answer.join("<br>") : flashcard.answer}</p>
                    </div>
                </div>
                <button onclick="deleteFlashcard(${i})">🗑️ Delete</button>
            `;

            card.addEventListener("click", () => {
                // Get all flashcards and remove "flip" class from others
                document.querySelectorAll(".flashcard").forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.classList.remove("flip");
                    }
                });
            
                // Flip the clicked flashcard
                card.classList.toggle("flip");
            });

            flashcardsContainer.appendChild(card);
        });
    }

    function shuffleFlashcards() {
        // Fisher-Yates Shuffle Algorithm
        for (let i = flashcardSets[setIndex].flashcards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [flashcardSets[setIndex].flashcards[i], flashcardSets[setIndex].flashcards[j]] =
            [flashcardSets[setIndex].flashcards[j], flashcardSets[setIndex].flashcards[i]];
        }
    
        saveToLocalStorage(); // Save shuffled order
        renderFlashcards(); // Re-render the flashcards
    }
    function startQuiz() {
        quizIndex = 0;
        quizModal.style.display = "flex"; // Show quiz pop-up
        showNextQuestion();
    }
    
    function showNextQuestion() {
        if (quizIndex < flashcardSets[setIndex].flashcards.length) {
            quizQuestion.textContent = flashcardSets[setIndex].flashcards[quizIndex].question;
            quizAnswerText.textContent = ""; // Hide answer
            quizInput.value = "";
            quizInput.style.display = "block"; /* Ensure input is visible */
            quizSubmit.style.display = "inline-block";
            quizNext.style.display = "none"; /* Hide "Next" until answer is checked */
            quizCard.classList.remove("flip"); // Reset flip
        } else {
            endQuiz();
        }
    }
    
    function checkAnswer() {
        console.log("Submit button clicked!"); // Debugging step
    
        if (!flashcardSets[setIndex] || !flashcardSets[setIndex].flashcards[quizIndex]) {
            console.error("Error: Flashcard does not exist.");
            return;
        }
    
        let userAnswer = quizInput.value.trim().toLowerCase();
        let correctAnswer = Array.isArray(flashcardSets[setIndex].flashcards[quizIndex].answer) 
            ? flashcardSets[setIndex].flashcards[quizIndex].answer.join(" ").toLowerCase() 
            : flashcardSets[setIndex].flashcards[quizIndex].answer.toLowerCase();
    
        if (userAnswer === correctAnswer) {
            quizAnswerText.textContent = "✅ Correct!";
            quizAnswerText.style.color = "green";
        } else {
            quizAnswerText.textContent = `❌ Incorrect. The correct answer is: ${correctAnswer}`;
            quizAnswerText.style.color = "red";
        }
    
        quizCard.classList.add("flip"); // Flip the card to show the answer
        quizInput.style.display = "none"; // Hide input after answer
        quizSubmit.style.display = "none";
        quizNext.style.display = "inline-block";
    }
    
    function endQuiz() {
        quizQuestion.textContent = "🎉 Quiz Complete! Well done!";
        quizAnswerText.textContent = "";
        quizInput.style.display = "none";
        quizSubmit.style.display = "none";
        quizNext.textContent = "Close";
        quizNext.style.display = "inline-block";
    
        quizNext.addEventListener("click", closeQuiz);
    }
    function closeQuiz() {
        quizModal.style.display = "none";
    }
    
    startQuizButton.addEventListener("click", startQuiz);
    quizSubmit.addEventListener("click", checkAnswer);
    quizNext.addEventListener("click", () => {
    quizIndex++;
    showNextQuestion();
});
quizClose.addEventListener("click", closeQuiz);
    let lastScrollTop = 0;
    const header = document.querySelector("header");
    
    window.addEventListener("scroll", () => {
        let scrollTop = window.scrollY;
    
        if (scrollTop > lastScrollTop) {
            header.style.top = "-60px"; // Hide header
        } else {
            header.style.top = "0"; // Show header
        }
    
        lastScrollTop = scrollTop;
    });
    
    function showFlashcardForm(callback) {
        const formContainer = document.createElement("div");
        formContainer.classList.add("modal-overlay");
        document.body.classList.add("blurred-background");
        
        formContainer.innerHTML = `
            <div class="input-form">
                <h3>Add Flashcard</h3>
                <input type="text" id="question" placeholder="Enter question..."autocomplete="off">
                <textarea id="answer" placeholder="Enter answers (separate with a comma)..."></textarea>
                <div class="form-buttons">
                    <button id="submit-flashcard">Save</button>
                    <button id="cancel-flashcard">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(formContainer);

        document.getElementById("submit-flashcard").addEventListener("click", () => {
            const question = document.getElementById("question").value.trim();
            const answer = document.getElementById("answer").value.trim();
            if (question && answer) {
                callback(question, answer.split(",").map(v => v.trim()));
                closeModal();
            }
        });
        
        document.getElementById("cancel-flashcard").addEventListener("click", closeModal);
    }

    function closeModal() {
        const modal = document.querySelector(".modal-overlay");
        if (modal) {
            modal.remove();
            document.body.classList.remove("blurred-background");
        }
    }

    function addFlashcard() {
        showFlashcardForm((question, answer) => {
            flashcardSets[setIndex].flashcards.push({ question, answer });
            saveToLocalStorage();
            renderFlashcards();
        });
    }

    function deleteFlashcard(flashcardIndex) {
        flashcardSets[setIndex].flashcards.splice(flashcardIndex, 1);
        saveToLocalStorage();
        renderFlashcards();
    }

    function saveToLocalStorage() {
        localStorage.setItem("flashcardSets", JSON.stringify(flashcardSets));
    }

    function goBack() {
        window.location.href = "FlashcardProj.html";
    }

    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("darkMode", JSON.stringify(isDark));
    });

    renderFlashcards();
    shuffleButton.addEventListener("click", shuffleFlashcards);
    startQuizButton.addEventListener("click", startQuiz);

    window.addFlashcard = addFlashcard;
    window.deleteFlashcard = deleteFlashcard;
    window.goBack = goBack;
});

