let quizData = [];
let currentChapterIndex = 0;
let currentQuestionIndex = 0;
let scores = [];
let reviewMode = {};
let userAnswers = {};
let currentChapter = null;
let questions = [];

document.addEventListener("DOMContentLoaded", () => {
    fetch("quizData.json")
        .then(res => res.json())
        .then(data => {
            quizData = data;
            loadTheme();
            showChapterMenu();
        })
        .catch(error => {
            console.error('Error loading quiz data:', error);
            document.getElementById('quiz').innerHTML = '<div class="alert alert-danger">Error loading quiz data. Please try again.</div>';
        });
});

function showChapterMenu() {
    const menuDiv = document.getElementById("chapter-menu");
    const buttonsContainer = document.getElementById("chapter-buttons");
    const quizDiv = document.getElementById("quiz");
    const attemptsDiv = document.getElementById("attempts");
    
    menuDiv.style.display = "block";
    quizDiv.innerHTML = "";
    attemptsDiv.style.display = "none";
    
    // Update title
    document.getElementById("quiz-title").textContent = "📘 Chapter-wise Interactive Quiz";
    document.getElementById("chapter-badge").textContent = "Select a chapter to begin";
    
    buttonsContainer.innerHTML = "";
    
    quizData.forEach((chapter, index) => {
        const isCompleted = scores.some(s => s.chapter === chapter.chapter);
        const score = scores.find(s => s.chapter === chapter.chapter);
        
        const colDiv = document.createElement("div");
        colDiv.className = "col-md-6 col-lg-4 mb-3";
        
        const buttonClass = isCompleted ? "btn-success" : "btn-outline-primary";
        const statusText = isCompleted ? `✅ Score: ${score.score.toFixed(2)}` : "📖 Start Chapter";
        
        colDiv.innerHTML = `
            <button class="btn ${buttonClass} w-100 h-100 d-flex flex-column justify-content-center" 
                    onclick="startChapter(${index})" style="min-height: 80px;">
                <strong>${chapter.chapter}</strong>
                <small class="mt-1">${chapter.questions.length} Questions</small>
                <small class="mt-1">${statusText}</small>
            </button>
        `;
        
        buttonsContainer.appendChild(colDiv);
    });
    
    // Add overall progress
    if (scores.length > 0) {
        const totalScore = scores.reduce((a, b) => a + b.score, 0);
        const completedChapters = scores.length;
        
        const progressDiv = document.createElement("div");
        progressDiv.className = "col-12 mt-3";
        progressDiv.innerHTML = `
            <div class="alert alert-info text-center">
                <strong>📊 Overall Progress:</strong> ${completedChapters}/${quizData.length} chapters completed | 
                <strong>Total Score:</strong> ${totalScore.toFixed(2)}
            </div>
        `;
        buttonsContainer.appendChild(progressDiv);
    }
}

function startChapter(chapterIndex) {
    currentChapterIndex = chapterIndex;
    currentChapter = quizData[chapterIndex];
    questions = currentChapter.questions;
    currentQuestionIndex = 0;
    
    // Hide chapter menu
    document.getElementById("chapter-menu").style.display = "none";
    
    // Update title and badge
    document.getElementById("quiz-title").textContent = currentChapter.chapter;
    const badge = document.getElementById("chapter-badge");
    badge.textContent = `${questions.length} Questions`;
    badge.className = "badge bg-primary";
    
    showQuestion(0);
}

function showQuestion(index) {
    const container = document.getElementById("quiz");
    const attemptsDiv = document.getElementById("attempts");
    container.innerHTML = "";
    attemptsDiv.style.display = "block";

    if (index >= questions.length) {
        return showChapterResults();
    }

    currentQuestionIndex = index;
    const question = questions[index];
    const chapterKey = currentChapter.chapter;
    const isSubmitted = scores.some(s => s.chapter === chapterKey);
    const inReview = reviewMode[chapterKey];

    const questionDiv = document.createElement("div");
    questionDiv.className = "card";
    questionDiv.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Question ${index + 1} of ${questions.length}</h5>
            <div class="d-flex align-items-center">
                <button class="btn btn-sm btn-outline-secondary me-2" onclick="showChapterMenu()">📚 Back to Chapters</button>
                <div class="progress" style="width: 200px;">
                    <div class="progress-bar" role="progressbar" style="width: ${((index + 1) / questions.length) * 100}%"></div>
                </div>
            </div>
        </div>
        <div class="card-body">
            <p class="card-text"><strong>Q${question.question}</strong></p>
            <div id="options-container"></div>
        </div>
    `;

    const optionsContainer = questionDiv.querySelector('#options-container');
    
    question.options.forEach((opt) => {
        const inputId = `q-${currentChapterIndex}-${index}-${opt}`;
        const wrapper = document.createElement("div");
        wrapper.className = "form-check mb-2";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q-${currentChapterIndex}-${index}`;
        input.value = opt;
        input.id = inputId;
        input.disabled = isSubmitted;
        input.checked = userAnswers[`${currentChapterIndex}-${index}`] === opt;
        input.className = "form-check-input";

        input.onchange = () => {
            userAnswers[`${currentChapterIndex}-${index}`] = opt;
            updateAttemptCount();
        };

        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", inputId);
        label.textContent = opt;

        if (inReview) {
            const userSelected = userAnswers[`${currentChapterIndex}-${index}`];
            if (opt === question.answer) {
                wrapper.classList.add("correct-answer");
                label.innerHTML = `✅ ${opt}`;
            }
            if (opt === userSelected && opt !== question.answer) {
                wrapper.classList.add("user-wrong-answer");
                label.innerHTML = `❌ ${opt}`;
            }
        }

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        optionsContainer.appendChild(wrapper);
    });

    if (inReview) {
        const reviewAlert = document.createElement("div");
        reviewAlert.className = "alert alert-info mt-3";
        reviewAlert.innerHTML = `
            <strong>Review Mode:</strong>
            <span class="badge bg-success ms-2">✅ Correct Answer</span>
            <span class="badge bg-danger ms-2">❌ Your Wrong Selection</span>
        `;
        questionDiv.querySelector('.card-body').appendChild(reviewAlert);
    }

    questionDiv.appendChild(createNavigation(index, isSubmitted, chapterKey));
    container.appendChild(questionDiv);
    updateAttemptCount();
}

function createNavigation(index, isSubmitted, chapterKey) {
    const navDiv = document.createElement("div");
    navDiv.className = "card-footer d-flex justify-content-between align-items-center";

    const leftButtons = document.createElement("div");
    const rightButtons = document.createElement("div");

    if (index > 0) {
        leftButtons.innerHTML = `<button class="btn btn-outline-secondary" onclick="goToQuestion(${index - 1})">⬅ Previous</button>`;
    }

    const centerButtons = document.createElement("div");
    
    if (!isSubmitted) {
        centerButtons.innerHTML = `
            <button class="btn btn-success me-2" onclick="handleSubmit()">✅ Submit Chapter</button>
            <button class="btn btn-secondary me-2" onclick="skipChapter()">⏭ Skip Chapter</button>
        `;
    }

    if (isSubmitted && !reviewMode[chapterKey]) {
        centerButtons.innerHTML = `<button class="btn btn-warning me-2" onclick="reviewMode['${chapterKey}'] = true; showQuestion(${currentQuestionIndex});">👁 Review Answers</button>`;
    }

    if (index < questions.length - 1) {
        rightButtons.innerHTML = `<button class="btn btn-primary" onclick="goToQuestion(${index + 1})">Next ➡</button>`;
    } else {
        rightButtons.innerHTML = `<button class="btn btn-success" onclick="showChapterResults()">🏁 Finish Chapter</button>`;
    }

    navDiv.appendChild(leftButtons);
    navDiv.appendChild(centerButtons);
    navDiv.appendChild(rightButtons);

    return navDiv;
}

function goToQuestion(index) {
    showQuestion(index);
}

function handleSubmit() {
    let correct = 0, wrong = 0;

    questions.forEach((q, qIndex) => {
        const answer = userAnswers[`${currentChapterIndex}-${qIndex}`];
        if (answer) {
            answer === q.answer ? correct++ : wrong++;
        }
    });

    const score = correct - wrong * 0.25;
    
    // Remove existing score for this chapter if any
    scores = scores.filter(s => s.chapter !== currentChapter.chapter);
    scores.push({ chapter: currentChapter.chapter, correct, wrong, score });
    
    showChapterResults();
}

function skipChapter() {
    showChapterMenu();
}

function updateAttemptCount() {
    const total = questions.length;
    let attempted = 0;

    questions.forEach((_, qIndex) => {
        if (userAnswers[`${currentChapterIndex}-${qIndex}`]) attempted++;
    });

    const attemptsDiv = document.getElementById("attempts");
    attemptsDiv.innerHTML = `
        <div class="row text-center">
            <div class="col-md-4">
                <strong>Questions Attempted:</strong> ${attempted} / ${total}
            </div>
            <div class="col-md-4">
                <strong>Progress:</strong> ${((attempted / total) * 100).toFixed(1)}%
            </div>
            <div class="col-md-4">
                <button class="btn btn-warning btn-sm" onclick="showChapterResults()">📊 View Results</button>
            </div>
        </div>
    `;
}

function showChapterResults() {
    // Calculate scores for current chapter
    let correct = 0, wrong = 0, unattempted = 0;

    questions.forEach((question, index) => {
        const userAnswer = userAnswers[`${currentChapterIndex}-${index}`];
        if (userAnswer) {
            if (userAnswer === question.answer) {
                correct++;
            } else {
                wrong++;
            }
        } else {
            unattempted++;
        }
    });

    const finalScore = correct - (wrong * 0.25);
    const percentage = ((correct / questions.length) * 100).toFixed(2);

    const resultDiv = document.getElementById("quiz");
    const attemptsDiv = document.getElementById("attempts");
    if (attemptsDiv) attemptsDiv.style.display = "none";

    resultDiv.innerHTML = `
        <div class="card">
            <div class="card-header text-center">
                <h2 class="mb-0">📊 Chapter Results</h2>
                <small class="text-muted">${currentChapter.chapter}</small>
            </div>
            <div class="card-body">
                <div class="row text-center mb-4">
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <h3>${correct}</h3>
                                <p class="mb-0">Correct</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-danger text-white">
                            <div class="card-body">
                                <h3>${wrong}</h3>
                                <p class="mb-0">Wrong</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body">
                                <h3>${unattempted}</h3>
                                <p class="mb-0">Unattempted</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <h3>${finalScore.toFixed(2)}</h3>
                                <p class="mb-0">Final Score</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="text-center mb-4">
                    <h4>Accuracy: ${percentage}%</h4>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${percentage >= 70 ? 'bg-success' : percentage >= 50 ? 'bg-warning' : 'bg-danger'}" 
                             style="width: ${percentage}%">${percentage}%</div>
                    </div>
                </div>

                <div class="text-center">
                    <button class="btn btn-primary me-2" onclick="showDetailedReview()">📝 Review Answers</button>
                    <button class="btn btn-secondary me-2" onclick="showChapterMenu()">📚 Back to Chapters</button>
                    <button class="btn btn-outline-primary me-2" onclick="retakeChapter()">🔄 Retake Chapter</button>
                    <button class="btn btn-outline-secondary" onclick="window.location.href='index.html'">🏠 Home</button>
                </div>
            </div>
        </div>
    `;
}

function showDetailedReview() {
    const resultDiv = document.getElementById("quiz");
    
    let reviewHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3 class="mb-0">📝 Detailed Review - ${currentChapter.chapter}</h3>
                <button class="btn btn-secondary btn-sm" onclick="showChapterResults()">⬅ Back to Results</button>
            </div>
            <div class="card-body" style="max-height: 70vh; overflow-y: auto;">
    `;

    questions.forEach((question, index) => {
        const userAnswer = userAnswers[`${currentChapterIndex}-${index}`];
        const isCorrect = userAnswer === question.answer;
        const isAttempted = userAnswer !== undefined;

        reviewHTML += `
            <div class="card mb-3 ${isAttempted ? (isCorrect ? 'border-success' : 'border-danger') : 'border-warning'}">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>Question ${index + 1}</strong>
                        <span class="badge ${isAttempted ? (isCorrect ? 'bg-success' : 'bg-danger') : 'bg-warning'}">
                            ${isAttempted ? (isCorrect ? 'Correct' : 'Wrong') : 'Not Attempted'}
                        </span>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>Q${question.question}</strong></p>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Options:</h6>
                            ${question.options.map((opt) => {
                                let optionClass = '';
                                let icon = '';
                                
                                if (opt === question.answer) {
                                    optionClass = 'text-success fw-bold';
                                    icon = '✅ ';
                                } else if (opt === userAnswer && opt !== question.answer) {
                                    optionClass = 'text-danger fw-bold';
                                    icon = '❌ ';
                                }
                                
                                return `<p class="${optionClass}">${icon}${opt}</p>`;
                            }).join('')}
                        </div>
                        <div class="col-md-6">
                            <h6>Answer Details:</h6>
                            <p><strong>Correct Answer:</strong> <span class="text-success">${question.answer}</span></p>
                            <p><strong>Your Answer:</strong> 
                                ${isAttempted ? 
                                    `<span class="${isCorrect ? 'text-success' : 'text-danger'}">${userAnswer}</span>` : 
                                    '<span class="text-warning">Not Attempted</span>'
                                }
                            </p>
                            <p><strong>Score:</strong> 
                                ${isAttempted ? (isCorrect ? '+1' : '-0.25') : '0'} points
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    reviewHTML += `
            </div>
            <div class="card-footer text-center">
                <button class="btn btn-secondary me-2" onclick="showChapterResults()">⬅ Back to Results</button>
                <button class="btn btn-primary me-2" onclick="showChapterMenu()">📚 Back to Chapters</button>
                <button class="btn btn-outline-primary" onclick="retakeChapter()">🔄 Retake Chapter</button>
            </div>
        </div>
    `;

    resultDiv.innerHTML = reviewHTML;
}

function retakeChapter() {
    // Clear answers for current chapter
    questions.forEach((_, index) => {
        delete userAnswers[`${currentChapterIndex}-${index}`];
    });
    
    // Remove score for this chapter
    scores = scores.filter(s => s.chapter !== currentChapter.chapter);
    
    // Remove review mode
    delete reviewMode[currentChapter.chapter];
    
    // Restart chapter
    showQuestion(0);
}

function showFinalResults() {
    showChapterMenu();
}

function toggleDarkMode() {
    const body = document.getElementById("body");
    body.classList.toggle("dark-mode");
    localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
}

function loadTheme() {
    if (localStorage.getItem("theme") === "dark") {
        document.getElementById("body").classList.add("dark-mode");
    }
}
                        
