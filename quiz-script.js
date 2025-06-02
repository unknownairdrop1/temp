let quizData = {};
let currentQuestionIndex = 0;
let scores = { correct: 0, wrong: 0, total: 0 };
let userAnswers = {};
let selectedDifficulty = '';
let questions = [];

document.addEventListener("DOMContentLoaded", () => {
    selectedDifficulty = localStorage.getItem('selectedDifficulty') || 'normal';
    
    fetch("nism-quiz-data.json")
        .then(res => res.json())
        .then(data => {
            quizData = data;
            loadTheme();
            initializeQuiz();
        })
        .catch(error => {
            console.error('Error loading quiz data:', error);
            document.getElementById('quiz').innerHTML = '<div class="alert alert-danger">Error loading quiz data. Please try again.</div>';
        });
});

function initializeQuiz() {
    const testData = selectedDifficulty === 'normal' ? quizData.test1 : quizData.test2;
    questions = testData.questions;
    
    // Update page title and difficulty badge
    document.getElementById('quiz-title').textContent = testData.title;
    const badge = document.getElementById('difficulty-badge');
    badge.textContent = `Difficulty: ${testData.difficulty}`;
    badge.className = `badge ${selectedDifficulty === 'normal' ? 'bg-success' : 'bg-danger'}`;
    
    showQuestion(0);
}

function showQuestion(index) {
    const container = document.getElementById("quiz");
    container.innerHTML = "";

    if (index >= questions.length) {
        return showFinalResults();
    }

    currentQuestionIndex = index;
    const question = questions[index];

    const questionDiv = document.createElement("div");
    questionDiv.className = "card";
    questionDiv.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Question ${index + 1} of ${questions.length}</h5>
            <div class="progress" style="width: 200px;">
                <div class="progress-bar" role="progressbar" style="width: ${((index + 1) / questions.length) * 100}%"></div>
            </div>
        </div>
        <div class="card-body">
            <p class="card-text"><strong>${question.question}</strong></p>
            <div id="options-container"></div>
        </div>
    `;

    const optionsContainer = questionDiv.querySelector('#options-container');
    
    Object.entries(question.options).forEach(([key, value]) => {
        const inputId = `q-${index}-${key}`;
        const wrapper = document.createElement("div");
        wrapper.className = "form-check mb-2";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q-${index}`;
        input.value = key;
        input.id = inputId;
        input.className = "form-check-input";
        input.checked = userAnswers[index] === key;

        input.onchange = () => {
            userAnswers[index] = key;
            updateAttemptCount();
        };

        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", inputId);
        label.innerHTML = `<strong>${key.toUpperCase()})</strong> ${value}`;

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        optionsContainer.appendChild(wrapper);
    });

    questionDiv.appendChild(createNavigation(index));
    container.appendChild(questionDiv);
    updateAttemptCount();
}

function createNavigation(index) {
    const navDiv = document.createElement("div");
    navDiv.className = "card-footer d-flex justify-content-between align-items-center";

    const leftButtons = document.createElement("div");
    const rightButtons = document.createElement("div");

    if (index > 0) {
        leftButtons.innerHTML = `<button class="btn btn-outline-secondary" onclick="goToQuestion(${index - 1})">⬅ Previous</button>`;
    }

    if (index < questions.length - 1) {
        rightButtons.innerHTML = `<button class="btn btn-primary" onclick="goToQuestion(${index + 1})">Next ➡</button>`;
    } else {
        rightButtons.innerHTML = `<button class="btn btn-success" onclick="showFinalResults()">🏁 Finish Quiz</button>`;
    }

    navDiv.appendChild(leftButtons);
    navDiv.appendChild(rightButtons);

    return navDiv;
}

function goToQuestion(index) {
    showQuestion(index);
}

function updateAttemptCount() {
    const attempted = Object.keys(userAnswers).length;
    const total = questions.length;

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
                <button class="btn btn-warning btn-sm" onclick="showFinalResults()">📊 View Results</button>
            </div>
        </div>
    `;
}

function showFinalResults() {
    // Calculate scores
    let correct = 0, wrong = 0, unattempted = 0;

    questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        if (userAnswer) {
            if (userAnswer === question.correct_answer) {
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
                <h2 class="mb-0">📊 Quiz Results</h2>
                <small class="text-muted">${selectedDifficulty === 'normal' ? 'Normal' : 'Very Hard'} Difficulty</small>
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
                    <button class="btn btn-secondary me-2" onclick="window.location.href='index.html'">🏠 Back to Home</button>
                    <button class="btn btn-outline-primary" onclick="location.reload()">🔄 Retake Quiz</button>
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
                <h3 class="mb-0">📝 Detailed Review</h3>
                <button class="btn btn-secondary btn-sm" onclick="showFinalResults()">⬅ Back to Results</button>
            </div>
            <div class="card-body" style="max-height: 70vh; overflow-y: auto;">
    `;

    questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct_answer;
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
                    <p><strong>${question.question}</strong></p>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Options:</h6>
                            ${Object.entries(question.options).map(([key, value]) => {
                                let optionClass = '';
                                let icon = '';
                                
                                if (key === question.correct_answer) {
                                    optionClass = 'text-success fw-bold';
                                    icon = '✅ ';
                                } else if (key === userAnswer && key !== question.correct_answer) {
                                    optionClass = 'text-danger fw-bold';
                                    icon = '❌ ';
                                }
                                
                                return `<p class="${optionClass}">${icon}<strong>${key.toUpperCase()})</strong> ${value}</p>`;
                            }).join('')}
                        </div>
                        <div class="col-md-6">
                            <h6>Answer Details:</h6>
                            <p><strong>Correct Answer:</strong> <span class="text-success">${question.correct_answer.toUpperCase()}</span></p>
                            <p><strong>Your Answer:</strong> 
                                ${isAttempted ? 
                                    `<span class="${isCorrect ? 'text-success' : 'text-danger'}">${userAnswer.toUpperCase()}</span>` : 
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
        </div>
    `;

    resultDiv.innerHTML = reviewHTML;
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
