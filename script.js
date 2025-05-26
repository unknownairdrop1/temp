let quizData = [];
let currentChapterIndex = 0;
let scores = [];
let reviewMode = {};

document.addEventListener("DOMContentLoaded", () => {
    fetch("quizData.json")
        .then((res) => res.json())
        .then((data) => {
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
    const isSubmitted = scores.some((s) => s.chapter === chapter.chapter);
    const inReview = reviewMode[chapter.chapter];

    const chapterDiv = document.createElement("div");
    chapterDiv.innerHTML = `<h2>${chapter.chapter}</h2>`;

    chapter.questions.forEach((q, qIndex) => {
        const qDiv = document.createElement("div");
        qDiv.className = "question";

        qDiv.innerHTML = `<p><strong>Q${qIndex + 1}:</strong> ${q.question}</p>`;

        q.options.forEach((opt) => {
            const inputId = `q-${index}-${qIndex}-${opt}`;
            const selected = document.querySelector(`input[name="q-${index}-${qIndex}"]:checked`);
            const selectedValue = selected ? selected.value : null;

            const input = document.createElement("input");
            input.className = "form-check-input";
            input.type = "radio";
            input.name = `q-${index}-${qIndex}`;
            input.value = opt;
            input.id = inputId;
            input.disabled = isSubmitted;
            input.checked = selectedValue === opt;
            input.onchange = () => updateAttemptCount();

            const label = document.createElement("label");
            label.className = "form-check-label ms-1";
            label.setAttribute("for", inputId);
            label.textContent = opt;

            const wrapper = document.createElement("div");
            wrapper.className = "form-check";

            if (inReview) {
                if (opt === q.answer) {
                    wrapper.classList.add("correct-answer");
                } else if (selectedValue === opt && opt !== q.answer) {
                    wrapper.classList.add("wrong-answer");
                }
            }

            wrapper.appendChild(input);
            wrapper.appendChild(label);
            qDiv.appendChild(wrapper);
        });

        chapterDiv.appendChild(qDiv);
    });

    const navDiv = document.createElement("div");
    navDiv.className = "mt-4";

    if (index > 0)
        navDiv.innerHTML += `<button class="btn btn-outline-secondary me-2" onclick="goToChapter(${index - 1})">⬅ Back</button>`;

    if (!isSubmitted) {
        navDiv.innerHTML += `<button class="btn btn-success me-2" onclick="handleSubmit(${index})">✅ Submit Chapter</button>`;
    }

    if (isSubmitted && !inReview) {
        navDiv.innerHTML += `<button class="btn btn-warning me-2" onclick="reviewMode['${chapter.chapter}'] = true; showChapter(${index});">👁 Review Answers</button>`;
    }

    if (index < quizData.length - 1)
        navDiv.innerHTML += `<button class="btn btn-outline-primary" onclick="goToChapter(${index + 1})">Next ➡</button>`;

    chapterDiv.appendChild(navDiv);
    container.appendChild(chapterDiv);

    updateAttemptCount();
}

function handleSubmit(index) {
    const chapter = quizData[index];
    let correct = 0, wrong = 0;

    chapter.questions.forEach((q, qIndex) => {
        const selected = document.querySelector(`input[name="q-${index}-${qIndex}"]:checked`);
        if (selected) {
            selected.value === q.answer ? correct++ : wrong++;
        }
    });

    const score = correct - wrong * 0.25;
    scores.push({ chapter: chapter.chapter, correct, wrong, score });

    showChapter(index);
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
        const selected = document.querySelector(`input[name="q-${currentChapterIndex}-${qIndex}"]:checked`);
        if (selected) attempted++;
    });

    const attemptsDiv = document.getElementById("attempts");
    attemptsDiv.textContent = `Questions Attempted: ${attempted} / ${total}`;
}

function showFinalResults() {
    const resultDiv = document.getElementById("quiz");
    document.getElementById("attempts").style.display = "none";

    resultDiv.innerHTML = "<h2 class='mb-4'>📘 Quiz Results Summary</h2>";
    let totalScore = 0;
    let totalAttempted = 0;
    let totalQuestions = 0;

    scores.forEach((res, i) => {
        const chapter = quizData[i];
        const attempted = res.correct + res.wrong;
        const questions = chapter.questions.length;

        totalScore += res.score;
        totalAttempted += attempted;
        totalQuestions += questions;

        resultDiv.innerHTML += `
      <div class="result mb-3 p-3 border rounded bg-white dark-mode-bg">
        <h4>${res.chapter}</h4>
        <p>✅ Correct: ${res.correct}</p>
        <p>❌ Wrong: ${res.wrong}</p>
        <p>📝 Attempted: ${attempted} / ${questions}</p>
        <p>📊 Score: <strong>${res.score.toFixed(2)}</strong></p>
      </div>
    `;
    });

    resultDiv.innerHTML += `
    <div class="alert alert-success text-center mt-4">
      <h3>✅ Total Attempted: ${totalAttempted} / ${totalQuestions}</h3>
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
