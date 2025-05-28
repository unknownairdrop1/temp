let quizData = [];
let currentChapterIndex = 0;
let scores = [];
let reviewMode = {};
let userAnswers = {};

document.addEventListener("DOMContentLoaded", () => {
    fetch("quizData.json")
        .then(res => res.json())
        .then(data => {
            quizData = data;
            loadTheme();
            showChapter(currentChapterIndex);
        });
});

function showChapter(index) {
    const container = document.getElementById("quiz");
    container.innerHTML = "";

    if (index >= quizData.length) return showFinalResults();

    const chapter = quizData[index];
    const chapterKey = chapter.chapter;
    const isSubmitted = scores.some(s => s.chapter === chapterKey);
    const inReview = reviewMode[chapterKey];

    const chapterDiv = document.createElement("div");
    chapterDiv.innerHTML = `<h2>${chapterKey}</h2>`;

    chapter.questions.forEach((q, qIndex) => {
        const qDiv = document.createElement("div");
        qDiv.className = "question";
        qDiv.innerHTML = `<p><strong>Q${qIndex + 1}:</strong> ${q.question}</p>`;

        q.options.forEach((opt) => {
            const inputId = `q-${index}-${qIndex}-${opt}`;
            const input = document.createElement("input");
            input.type = "radio";
            input.name = `q-${index}-${qIndex}`;
            input.value = opt;
            input.id = inputId;
            input.disabled = isSubmitted;
            input.checked = userAnswers[`${index}-${qIndex}`] === opt;
            input.className = "form-check-input";

            input.onchange = () => {
                userAnswers[`${index}-${qIndex}`] = opt;
                updateAttemptCount();
            };

            const label = document.createElement("label");
            label.className = "form-check-label ms-1";
            label.setAttribute("for", inputId);
            label.textContent = opt;

            const wrapper = document.createElement("div");
            wrapper.className = "form-check";

            if (inReview) {
                const userSelected = userAnswers[`${index}-${qIndex}`];
                if (opt === q.answer) {
                    wrapper.classList.add("correct-answer");
                }
                if (opt === userSelected && opt !== q.answer) {
                    wrapper.classList.add("user-wrong-answer");
                }
            }

            wrapper.appendChild(input);
            wrapper.appendChild(label);
            qDiv.appendChild(wrapper);
        });

        chapterDiv.appendChild(qDiv);
    });

    if (inReview) {
        chapterDiv.innerHTML += `
            <div class="alert alert-info mt-3">
                <strong>Review Mode:</strong>
                <span class="badge bg-success">Correct Answer</span>
                <span class="badge bg-danger">Your Wrong Selection</span>
            </div>
        `;
    }

    chapterDiv.appendChild(createNavigation(index, isSubmitted, chapterKey));
    container.appendChild(chapterDiv);
    updateAttemptCount();
}

function createNavigation(index, isSubmitted, chapterKey) {
    const navDiv = document.createElement("div");
    navDiv.className = "mt-4";

    if (index > 0)
        navDiv.innerHTML += `<button class="btn btn-outline-secondary me-2" onclick="goToChapter(${index - 1})">⬅ Back</button>`;

    if (!isSubmitted) {
        navDiv.innerHTML += `<button class="btn btn-success me-2" onclick="handleSubmit(${index})">✅ Submit Chapter</button>`;
        navDiv.innerHTML += `<button class="btn btn-secondary me-2" onclick="skipChapter(${index})">⏭ Skip Chapter</button>`;
    }

    if (isSubmitted && !reviewMode[chapterKey])
        navDiv.innerHTML += `<button class="btn btn-warning me-2" onclick="reviewMode['${chapterKey}'] = true; showChapter(${index});">👁 Review Answers</button>`;

    if (index < quizData.length - 1)
        navDiv.innerHTML += `<button class="btn btn-outline-primary" onclick="goToChapter(${index + 1})">Next ➡</button>`;

    navDiv.innerHTML += `<button class="btn btn-danger float-end" onclick="showFinalResults()">🏁 Finish Quiz</button>`;

    return navDiv;
}

function handleSubmit(index) {
    const chapter = quizData[index];
    let correct = 0, wrong = 0;

    chapter.questions.forEach((q, qIndex) => {
        const answer = userAnswers[`${index}-${qIndex}`];
        if (answer) {
            answer === q.answer ? correct++ : wrong++;
        }
    });

    const score = correct - wrong * 0.25;
    scores.push({ chapter: chapter.chapter, correct, wrong, score });
    showChapter(index);
}

function skipChapter(index) {
    // Skip chapter — no score entry
    goToChapter(index + 1);
}

function goToChapter(index) {
    currentChapterIndex = index;
    showChapter(index);
}

function updateAttemptCount() {
    const chapter = quizData[currentChapterIndex];
    const total = chapter.questions.length;
    let attempted = 0;

    chapter.questions.forEach((_, qIndex) => {
        if (userAnswers[`${currentChapterIndex}-${qIndex}`]) attempted++;
    });

    const attemptsDiv = document.getElementById("attempts");
    attemptsDiv.textContent = `Questions Attempted: ${attempted} / ${total}`;
}

function showFinalResults() {
    const resultDiv = document.getElementById("quiz");
    const attemptsDiv = document.getElementById("attempts");
    if (attemptsDiv) attemptsDiv.style.display = "none";

    resultDiv.innerHTML = `
        <h2 class='mb-4'>📘 Quiz Results Summary</h2>
        <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>📖 Chapter</th>
                    <th>✅ Correct</th>
                    <th>❌ Wrong</th>
                    <th>📝 Attempted</th>
                    <th>📋 Total</th>
                    <th>📊 Score</th>
                </tr>
            </thead>
            <tbody>
                ${scores.map((res, i) => {
                    const chapter = quizData.find(c => c.chapter === res.chapter);
                    const attempted = res.correct + res.wrong;
                    return `
                        <tr>
                            <td>${res.chapter}</td>
                            <td>${res.correct}</td>
                            <td>${res.wrong}</td>
                            <td>${attempted}</td>
                            <td>${chapter.questions.length}</td>
                            <td><strong>${res.score.toFixed(2)}</strong></td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

    const totalScore = scores.reduce((a, b) => a + b.score, 0);
    const totalQuestions = scores.reduce((a, b) => a + quizData.find(q => q.chapter === b.chapter).questions.length, 0);
    const totalAttempted = scores.reduce((a, b) => a + b.correct + b.wrong, 0);

    resultDiv.innerHTML += `
        <div class="alert alert-success text-center mt-4">
            <h3>✅ Attempted: ${totalAttempted} / ${totalQuestions}</h3>
            <h3>📊 Total Score: ${totalScore.toFixed(2)}</h3>
        </div>
    `;
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
