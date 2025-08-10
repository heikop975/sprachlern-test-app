/* Een Frikandell Special — Mini lesson "Begroeting" */
/* TTS via Web Speech API; simple tasks: image-match, audio-mcq, word-builder */

const lessons = {
  greetings: {
    title: "Begroeting & Voorstellen",
    tasks: [
      // image-match (emoji as image)
      { type: "image-match", title: "Kies het juiste woord bij het plaatje", items:[
          {key:"Hallo", img:"👋"},
          {key:"Goedemorgen", img:"🌅"},
          {key:"Tot ziens", img:"👋🏁"}
        ], correct:"Hallo"
      },
      // audio multiple choice (TTS)
      { type: "audio-mcq", title: "Luister en kies de juiste zin", items:[
          {key:"Hallo, hoe gaat het?", audio:"Hallo, hoe gaat het?"},
          {key:"Ik heet Maria.", audio:"Ik heet Maria."},
          {key:"Waar woon je?", audio:"Waar woon je?"}
        ], correct:"Ik heet Maria."
      },
      // word-builder
      { type: "word-builder", title: "Bouw de zin: Ik heet Marco", tiles:["Ik","heet","Marco"], target:"Ik heet Marco" },
      // short phrase recognition
      { type: "audio-mcq", title: "Luister en kies: 'Goedemorgen'", items:[
          {key:"Goedemorgen", audio:"Goedemorgen"},
          {key:"Goedenavond", audio:"Goedenavond"},
          {key:"Tot straks", audio:"Tot straks"}
        ], correct:"Goedemorgen"
      },
      // introduction formula
      { type: "word-builder", title: "Bouw: Ik kom uit Duitsland", tiles:["Ik","kom","uit","Duitsland"], target:"Ik kom uit Duitsland" }
    ]
  }
};

let currentLesson = null;
let currentTaskIndex = 0;
let points = parseInt(localStorage.getItem("efs_points")||"0",10);
let streak = parseInt(localStorage.getItem("efs_streak")||"0",10);

const pointsEl = document.getElementById("points");
const streakEl = document.getElementById("streak");
pointsEl.textContent = points;
streakEl.textContent = streak;

document.addEventListener("click",(e)=>{
  const btn = e.target.closest(".lesson-btn");
  if(btn) startLesson(btn.dataset.lesson);
});

document.getElementById("back").addEventListener("click", ()=> showScreen("home"));
document.getElementById("next").addEventListener("click", ()=> nextTask());

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function startLesson(key){
  currentLesson = lessons[key];
  currentTaskIndex = 0;
  document.getElementById("lesson-title").textContent = currentLesson.title;
  renderTask();
  showScreen("lesson");
}

function renderTask(){
  const task = currentLesson.tasks[currentTaskIndex];
  const tpl = document.getElementById("task-tpl");
  const clone = tpl.content.cloneNode(true);
  clone.querySelector(".task-title").textContent = task.title;
  const body = clone.querySelector(".task-body");
  const feedback = clone.querySelector(".feedback");

  if(task.type === "image-match"){
    const grid = document.createElement("div");
    grid.className = "choice-grid";
    task.items.forEach(it=>{
      const c = document.createElement("div");
      c.className = "choice";
      c.innerHTML = `<div style="font-size:36px">${it.img}</div><div style="margin-top:6px">${it.key}</div>`;
      c.addEventListener("click", ()=> handleChoice(c, it.key, task.correct, feedback));
      grid.appendChild(c);
    });
    body.appendChild(grid);
  }

  if(task.type === "audio-mcq"){
    const playBtn = document.createElement("button");
    playBtn.className = "primary";
    playBtn.textContent = "▶️ Afspelen";
    playBtn.addEventListener("click", ()=> speak(task.items.find(i=>i.key===task.correct)?.audio || task.items[0].audio));
    body.appendChild(playBtn);

    const grid = document.createElement("div");
    grid.className = "choice-grid";
    task.items.forEach(it=>{
      const c = document.createElement("div");
      c.className = "choice";
      c.textContent = it.key;
      c.addEventListener("click", ()=> handleChoice(c, it.key, task.correct, feedback));
      grid.appendChild(c);
    });
    body.appendChild(grid);
  }

  if(task.type === "word-builder"){
    const target = document.createElement("div");
    target.className = "tile-row";
    target.dataset.target = task.target;
    target.style.minHeight = "44px";
    body.appendChild(target);

    const tiles = document.createElement("div");
    tiles.className = "tile-row";
    const shuffled = task.tiles.slice().sort(()=>Math.random()-0.5);
    shuffled.forEach(t=>{
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = t;
      tile.addEventListener("click", ()=>{
        const el = document.createElement("div");
        el.className = "tile";
        el.textContent = t;
        el.addEventListener("click", ()=> el.remove());
        target.appendChild(el);
      });
      tiles.appendChild(tile);
    });
    body.appendChild(tiles);

    const checkBtn = document.createElement("button");
    checkBtn.className = "primary";
    checkBtn.textContent = "Controleren";
    checkBtn.addEventListener("click", ()=>{
      const built = Array.from(target.children).map(n=>n.textContent).join(" ").trim();
      if(built === task.target){
        feedback.textContent = "Goed gedaan! ✅";
        awardPoints(10);
      } else {
        feedback.textContent = "Probeer opnieuw.";
        markWrong(target);
      }
    });
    body.appendChild(checkBtn);
  }

  const area = document.getElementById("task-area");
  area.innerHTML = "";
  area.appendChild(clone);
}

function handleChoice(element, key, correct, feedbackEl){
  if(key === correct){
    element.classList.add("correct");
    feedbackEl.textContent = "Goed! ✅";
    awardPoints(5);
  } else {
    element.classList.add("wrong");
    feedbackEl.textContent = "Helaas, niet goed. Probeer de volgende.";
    element.animate([{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}],{duration:300});
  }
}

function nextTask(){
  const tasks = currentLesson.tasks;
  if(currentTaskIndex < tasks.length -1){
    currentTaskIndex++;
    renderTask();
  } else {
    const last = document.querySelector(".feedback");
    if(last) last.textContent = "Les voltooid! 🎉";
    awardStreak();
    setTimeout(()=> showScreen("home"),1000);
  }
}

function awardPoints(n){
  points += n;
  localStorage.setItem("efs_points", points);
  pointsEl.textContent = points;
}

function awardStreak(){
  const last = localStorage.getItem("efs_last_day") || "";
  const now = today();
  if(last === now){
    streak = parseInt(localStorage.getItem("efs_streak")||"0",10) + 1;
  } else {
    streak = 1;
  }
  localStorage.setItem("efs_streak", streak);
  localStorage.setItem("efs_last_day", now);
  streakEl.textContent = streak;
}

function today(){ const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }

function markWrong(el){
  el.animate([{background:"#ffdfe0"},{background:"transparent"}],{duration:600});
}

/* Simple TTS */
function speak(text){
  if('speechSynthesis' in window){
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'nl-NL';
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } else {
    alert("TTS niet beschikbaar op dit apparaat.");
  }
}
