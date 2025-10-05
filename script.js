// ==================== OYUN KAYIT SİSTEMİ ====================
let playerAnswers = [];
let gameStartTime = null;
let questionStartTime = null;

// Cevabı kaydet
function saveAnswer(questionIndex, selectedOption, optionIndex, timeSpent) {
    const scene = storyData[questionIndex];
    
    // Eğer bu son soruysa (hikaye bitiş sorusu) kaydetme
    if (scene.isFinalQuestion) {
        console.log("Son soru - kayıt yapılmadı");
        return;
    }
    
    const editorNote = scene.options[optionIndex]?.editorNote || "Editör notu bulunmamaktadır.";
    
    const answer = {
        questionIndex: questionIndex,
        questionText: scene.question,
        selectedOption: selectedOption,
        optionIndex: optionIndex,
        timeSpent: timeSpent,
        timestamp: new Date().toISOString(),
        editorNote: editorNote
    };
    
    playerAnswers.push(answer);
    localStorage.setItem('bytecore_player_answers', JSON.stringify(playerAnswers));
    console.log("Cevap kaydedildi:", answer);
}

// Soru başlangıcını kaydet
function startQuestionTimer() {
    questionStartTime = new Date();
}

// Soru süresini hesapla
function getQuestionTime() {
    if (!questionStartTime) return 0;
    const endTime = new Date();
    return Math.round((endTime - questionStartTime) / 1000); // saniye cinsinden
}

// Oyunu başlat
function startGame() {
    gameStartTime = new Date();
    playerAnswers = [];
    localStorage.setItem('bytecore_player_answers', JSON.stringify(playerAnswers));
    localStorage.setItem('bytecore_game_start_time', gameStartTime.toISOString());
    
    // Basit temayı başlat
    initializeSimpleTheme();
}

// Oyunu bitir ve rapor oluştur
function endGame() {
    const gameEndTime = new Date();
    const gameStartTime = new Date(localStorage.getItem('bytecore_game_start_time'));
    const totalTime = Math.round((gameEndTime - gameStartTime) / 1000); // saniye cinsinden
    
    const savedAnswers = JSON.parse(localStorage.getItem('bytecore_player_answers') || '[]');
    
    // Son soruyu (hikaye bitiş sorusunu) filtrele - karneye dahil etme
    const filteredAnswers = savedAnswers.filter(answer => {
        const scene = storyData[answer.questionIndex];
        return !scene || !scene.isFinalQuestion;
    });
    
    // Toplam soru sayısını hesapla (son soru hariç)
    const totalQuestions = storyData.filter(scene => !scene.isFinalQuestion).length;
    
    // İstatistikler (filtrelenmiş cevaplarla)
    const totalAnswers = filteredAnswers.length;
    
    // Soru başına ortalama süreyi hesapla
    // Toplam süreyi toplam soru sayısına böl (son soru hariç)
    const averageTimePerQuestion = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;
    
    // Rapor oluştur
    const gameReport = {
        playerAnswers: filteredAnswers, // Filtrelenmiş cevaplar
        totalTime: totalTime,
        totalAnswers: totalAnswers,
        totalQuestions: totalQuestions, // Toplam soru sayısı
        averageTimePerQuestion: averageTimePerQuestion,
        endTime: gameEndTime.toISOString()
    };
    
    localStorage.setItem('bytecore_game_report', JSON.stringify(gameReport));
    showGameReport(gameReport);
    
    return gameReport;
}

// Oyun raporunu göster
function showGameReport(report) {
    // Mevcut oyun ekranını temizle
    const storyArea = document.querySelector('.story-area');
    const storyLog = document.querySelector('.story-log');
    
    if (storyArea && storyLog) {
        storyArea.innerHTML = '';
        storyLog.innerHTML = '';
        
        // Rapor ekranı oluştur
        const reportHTML = `
            <div class="game-report">
                <h1>Gaem Completed!</h1>
                <div class="report-stats">
                    <div class="stat-item">
                        <h3>Total Time</h3>
                        <div class="stat-value">${formatTime(report.totalTime)}</div>
                    </div>
                    <div class="stat-item">
                        <h3>Total Question</h3>
                        <div class="stat-value">${report.totalAnswers}</div>
                    </div>
                    <div class="stat-item">
                        <h3>Average Question Time</h3>
                        <div class="stat-value">${formatTime(report.averageTimePerQuestion)}</div>
                    </div>
                </div>
                <div class="answers-details">
                    <h3>Detailed Analisis</h3>
                    <div class="answers-list">
                        ${report.playerAnswers.map((answer, index) => `
                            <div class="answer-item">
                                <div class="answer-header">
                                    <div class="answer-number">Question ${index + 1}</div>
                                    <div class="answer-time">⏱️ ${formatTime(answer.timeSpent)}</div>
                                </div>
                                <div class="question-text">${answer.questionText}</div>
                                <div class="selected-answer">
                                    <strong>Your Answer:</strong> ${answer.selectedOption}
                                </div>
                                <div class="editor-note">
                                    <strong>Note of Editor:</strong> ${answer.editorNote}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="report-actions">
                    <button onclick="restartGame()" class="play-button">🔄 Replay</button>
                    <button onclick="goToMainMenu()" class="play-button">🏠 Main Menu</button>
                </div>
            </div>
        `;
        
        storyArea.innerHTML = reportHTML;
        
        // Log alanına da basit rapor ekle
        storyLog.innerHTML = `
            <h3>Summarize of Game</h3>
            <p>Total Time: ${formatTime(report.totalTime)}</p>
            <p>Answered Question: ${report.totalAnswers}</p>
            <p>Average Time: ${formatTime(report.averageTimePerQuestion)}</p>
        `;
    }
}

// Zaman formatı
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds} seconds`;
    } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes} minute ${remainingSeconds} second`;
    }
}

// Oyunu yeniden başlat
function restartGame() {
    window.location.reload();
}
// Ana menüye dön
function goToMainMenu() {
    window.location.href = 'index.html';
}

// ==================== BASİT YAZI ANİMASYON SİSTEMİ ====================

let isTyping = false;
const typingQueue = [];

// Yazı animasyonu kuyruğuna ekle
function addToTypingQueue(text) {
    typingQueue.push(text);
    if (!isTyping) {
        processTypingQueue();
    }
}

// Kuyruğu işle
function processTypingQueue() {
    if (typingQueue.length === 0) {
        isTyping = false;
        return;
    }
    
    isTyping = true;
    const text = typingQueue.shift();
    typeText(text, processTypingQueue);
}

// Metni yazdır
function typeText(text, onComplete) {
    const li = document.createElement("li");
    li.className = 'log-item';
    logList.appendChild(li);

    let index = 0;
    const typingSpeed = 30; // ms per character

    function typeCharacter() {
        if (index < text.length) {
            li.textContent = text.substring(0, index + 1);
            index++;
            logList.scrollTop = logList.scrollHeight;
            setTimeout(typeCharacter, typingSpeed);
        } else {
            if (onComplete) onComplete();
        }
    }

    typeCharacter();
}

// Basit tema
function initializeSimpleTheme() {
    const storyLog = document.querySelector('.story-log');
    if (storyLog) {
        storyLog.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        storyLog.style.background = 'rgba(0, 0, 0, 0.8)';
        storyLog.style.color = '#e6d8cf';
    }
}

const storyData = [
  {
    background: "img/1.jpg",
    rightImage: "img/1s.jpg",
    hint: "Captain Diego checking the 'weather' doesn’t only mean wind or rain—it also includes solar space weather events. This is an actual practice in modern navigation.",
    intro: "Captain Diego and his assistant Pedro are about to set sail from Spain to Brazil. While listening to the radio, they heard that solar particle storms from the Sun can affect satellite communication and navigation systems.",
    question: "Diego checked the space weather reports from NOAA’s SWPC website. The report he reviewed is shown on the right.",
    options: [
      {
        text: "They plan their route.",
        backText: "They plan their route using the space weather report.",
        logText: "Diego carefully studies solar activity and adjusts the route to sail through safer regions. This precaution will make a big difference later. They prepare the ship and set sail.",
        hoverBackground: "img/1.1.jpg",
        editorNote: "Good choice; could also visualize NOAA data directly on the map to show safer paths."
      },
      {
        text: "They set sail immediately.",
        backText: "They depart without any preparation.",
        logText: "The captain, eager not to waste time, leaves without checking the reports. Yet Pedro wonders, ‘What if there’s a solar storm?’ The compass points the way, and the sea awaits them.",
        hoverBackground: "img/1.2.jpg",
        editorNote: "Ignoring data; highlighting space weather risks would improve realism."
      },
      {
        text: "They check the equipment.",
        backText: "Based on the reports, they perform equipment checks.",
        logText: "Pedro tests the communication devices, while Diego checks the backup GPS connections. Everything is ready; the journey begins with a well-prepared crew.",
        hoverBackground: "img/1.3.jpg",
        editorNote: "Smart move; could include NASA readings to guide checks more accurately."
      },
      {
        text: "They inspect the supplies.",
        backText: "They organize their provisions based on the information learned.",
        logText: "Diego increases food and water storage in case of storms or losing direction. This cautious move will prove useful later. Preparations complete, the ship leaves the harbor.",
        hoverBackground: "img/1.4.jpg",
        editorNote: "Prudent action; using storm probability data would add educational value."
      }
    ],
    next: [1, 1, 1, 1]
  },
  {
    background: "img/2.jpg",
    rightImage: "img/2s.jpg",
    hint: "X-class solar flares release energy equivalent to billions of hydrogen bombs and can disrupt radio communication, GPS, and power grids.",
    intro: "During their voyage, a TV broadcast announced an 'X-class solar flare warning.' The high-energy particles from the Sun disrupted their GPS and cut off radio signals, making navigation difficult.",
    question: "This reminded Diego of the X45 super flare witnessed in 2003. The super flare is shown on the right.",
    options: [
      {
        text: "They use an old map.",
        backText: "They navigate using an old map found on the ship.",
        logText: "Diego opens an old map from a chest and recalls ancient sailing routes. But the storm makes some points unclear.",
        hoverBackground: "img/2.1.jpg",
        editorNote: "Creative solution; could link historical storm data to support navigation."
      },
      {
        text: "They navigate by the stars.",
        backText: "They steer according to the stars’ positions.",
        logText: "At night, Pedro tries to navigate by starlight, but as clouds gather, the stars disappear. A heavy silence fills the ship.",
        hoverBackground: "img/2.2.jpeg",
        editorNote: "Traditional method; adding geomagnetic storm info could show limits of celestial navigation."
      },
      {
        text: "They wait for the radio signal to return.",
        backText: "They wait until the radio frequency becomes clear again.",
        logText: "The captain patiently waits for the radio to come back, but time drags on and the crew grows uneasy. A cold wind blows from the northwest.",
        hoverBackground: "img/2.3.jpg",
        editorNote: "Patient approach; could explain how space weather affects radio frequency."
      },
      {
        text: "They estimate their position.",
        backText: "They estimate their position using water depth and maps.",
        logText: "Pedro measures the water depth and compares it with old records. Their calculations lead them toward the northern shores.",
        hoverBackground: "img/2.4.jpg",
        editorNote: "Clever use; integrating real ocean depth data would reinforce learning."
      }
    ],
    next: [2, 2, 2, 2]
  },
  {
    background: "img/3.jpg",
    rightImage: "img/3s.png",
    hint: "The Canadian Space Weather Forecast Centre is part of the World Meteorological Organization and monitors geomagnetic storms across the country.",
    intro: "After losing their direction, Diego and Pedro finally reached Canada.",
    question: "They anchored their ship safely and decided to stay in Canada until systems recovered. They planned to explore the country. The aurora they saw is shown on the right.",
    options: [
      {
        text: "Niagara Falls",
        backText: "They decide to visit Niagara Falls.",
        logText: "Watching the power of the waterfall reminds them of the Sun’s energy. This sparks new curiosity in Pedro.",
        hoverBackground: "img/3.1.png",
        editorNote: "Fun choice; could mention aurora prediction data to connect science to experience."
      },
      {
        text: "Coast Mountains",
        backText: "They decide to visit the Coast Mountains.",
        logText: "They hear they might see auroras from the mountain peaks. Pedro’s eyes light up—he now wants to study space weather firsthand.",
        hoverBackground: "img/3.2.jpg",
        editorNote: "Good choice; including aurora activity data would enhance realism."
      },
      {
        text: "Ottawa",
        backText: "They decide to visit Ottawa.",
        logText: "In the capital, they visit the Canadian Space Weather Forecast Centre and learn from scientists about the effects of solar storms on Earth.",
        hoverBackground: "img/3.3.jpg",
        editorNote: "Educational choice; could show Canadian space weather monitoring data."
      },
      {
        text: "Old Quebec",
        backText: "They decide to visit Old Quebec.",
        logText: "While wandering the historic streets, they hear an aurora alert on a café radio. The news leads them northward to a new observation point.",
        hoverBackground: "img/3.4.jpg",
        editorNote: "Interesting choice; could highlight aurora alerts to engage users."
      }
    ],
    next: [3, 3, 3, 3]
  },
  {
    background: "img/4.jpg",
    rightImage: "img/4s.png",
    hint: "Auroras form when solar wind interacts with Earth’s magnetosphere—one of the most visual examples of space weather events.",
    intro: "Suddenly, the sky turned green and purple. Pedro shouted excitedly: “Auroras!” Captain Diego wondered how this phenomenon occurred.",
    question: "Pedro immediately explained: “It happens when particles from the Sun collide with Earth’s magnetic field. The formation process is shown on the right.”",
    options: [
      {
        text: "They enjoy the moment.",
        backText: "They lie on the grass and enjoy the moment.",
        logText: "They quietly gaze at the sky, feeling nature’s magic. Diego begins to wonder about the science behind the lights.",
        hoverBackground: "img/4.1.jpeg",
        editorNote: "Nice observation; could display particle data to show cause of auroras."
      },
      {
        text: "They admire the colors in the sky.",
        backText: "They lie down and admire the stars and colors above.",
        logText: "Pedro takes out a camera and records the scene. 'We should send this to the EMBRACE center,' he says.",
        hoverBackground: "img/4.2.jpg",
        editorNote: "Engaging; could overlay solar wind data for interactive learning."
      },
      {
        text: "They silently watch and smile.",
        backText: "They silently watch the surroundings and smile.",
        logText: "As the captain enjoys the peaceful moment, he still worries about the broken GPS. 'We should fix it before returning,' he thinks.",
        hoverBackground: "img/4.3.jpg",
        editorNote: "Reflective choice; explaining geomagnetic interactions would deepen understanding."
      },
      {
        text: "They head back to the ship.",
        backText: "They decide not to linger and return to their ship.",
        logText: "As the lights fade, Pedro says, 'We should check the systems before sailing again.'",
        hoverBackground: "img/4.4.jpg",
        editorNote: "Practical choice; could summarize aurora causes with NASA data for clarity."
      }
    ],
    next: [4, 4, 4, 4]
  },
  {
  background: "img/5.jpg",
  rightImage: "img/5s.png",
  hint: "EMBRACE is operated by Brazil’s National Institute for Space Research (INPE) and tracks solar activity in real time.",
  intro: "The system malfunction was finally resolved. Before setting course for Brazil, Diego checked the space weather reports from the EMBRACE system.",
  question: "The Brazilian Space Weather Program analyzed solar data and predicted regional impacts. Pedro still wondered if another X-class flare could cause further problems. The solar data is shown on the right.",
  options: [
    {
      text: "Review space weather reports.",
      backText: "Diego reviews the space weather reports for navigational safety.",
      logText: "The latest readings show that the Sun is becoming active again. The captain decides to proceed cautiously.",
      hoverBackground: "img/5.1.jpeg",
      editorNote: "Excellent; could show EMBRACE system readings for a real-time experience."
    },
    {
      text: "Ask questions about X-class flares.",
      backText: "Pedro curiously asks about the effects of X-class flares.",
      logText: "“If another flare hits, will our GPS fail again?” he asks. Diego studies the reports and nods.",
      hoverBackground: "img/5.2.jpeg",
      editorNote: "Curious approach; could simulate particle storm effects on GPS for engagement."
    },
    {
      text: "Discuss the Sun’s effects on Earth.",
      backText: "They discuss how solar activity affects Earth systems.",
      logText: "Their conversation helps them realize how dependent technology is on space weather.",
      hoverBackground: "img/5.3.jpeg",
      editorNote: "Analytical choice; adding satellite data could visualize impacts."
    },
    {
      text: "Adjust route based on safe zones.",
      backText: "They review the reports and adjust their route according to safer regions.",
      logText: "They replan and begin preparing the ship for departure.",
      hoverBackground: "img/5.4.jpg",
      editorNote: "Smart strategy; could highlight predicted storm zones from reports."
    }
  ],
  next: [5,5,5,5]
},
{
  background: "img/6.jpg",
  rightImage: "img/5s.png",
  hint: "This is a transition scene; it’s not directly related to space weather but keeps the story flow.",
  intro: "As they continued across the ocean, their supplies began to run low.",
  question: "A distant island appeared, but approaching it was risky. Solar activity data is shown on the right.",
  options: [
    {
      text: "Continue their route, avoiding risk.",
      backText: "They decide to stay on course, thinking the island might be dangerous.",
      logText: "Despite hunger, they choose safety. But soon the GPS signal weakens again.",
      hoverBackground: "img/6.1.jpg",
      editorNote: "Prudent choice; could include space weather forecast to justify caution."
    },
    {
      text: "Take the risk and approach the island.",
      backText: "They decide to take the risk and approach the island in search of food.",
      logText: "As they land, they notice interference in their instruments again — solar activity seems to be rising.",
      hoverBackground: "img/6.2.jpg",
      editorNote: "Risky choice; showing solar activity data would explain potential dangers."
    },
    {
      text: "Share the last of their supplies.",
      backText: "They carefully share what’s left of their food on board.",
      logText: "They show solidarity and teamwork. Pedro frowns, “The GPS failed again.”",
      hoverBackground: "img/6.3.jpeg",
      editorNote: "Teamwork highlighted; could integrate real-time storm impact on supplies."
    },
    {
      text: "Observe the island from afar.",
      backText: "They decide to observe the island’s safety from a distance.",
      logText: "Through binoculars, they spot strange interference on their communication devices.",
      hoverBackground: "img/6.4.jpeg",
      editorNote: "Cautious observation; using satellite data could add educational context."
    }
  ],
  next: [6,6,6,6]
},
{
  background: "img/7.jpg",
  rightImage: "img/7s.png",
  hint: "This is a transition scene; still connected to space weather through GPS and geomagnetic interference.",
  intro: "As they neared Brazil, the ship’s GPS system malfunctioned once again.",
  question: "The captain turned to his assistant and asked, “Could it be another solar storm?” Pedro nodded. Solar activity data is shown on the right.",
  options: [
    {
      text: "Realize it’s caused by a solar storm.",
      backText: "The captain realizes the GPS malfunction is due to a solar storm.",
      logText: "Diego now recognizes the signs. “It’s a geomagnetic storm,” he says confidently.",
      hoverBackground: "img/7.1.jpeg",
      editorNote: "Insightful choice; could show geomagnetic storm data for better understanding."
    },
    {
      text: "Explain how geomagnetic storms affect navigation.",
      backText: "Pedro explains that geomagnetic storms can disrupt navigation systems.",
      logText: "Pedro recalls what he learned earlier and explains, while Diego nods in agreement.",
      hoverBackground: "img/7.2.jpeg",
      editorNote: "Educational; overlaying NOAA data could strengthen the explanation."
    },
    {
      text: "Try alternative navigation methods.",
      backText: "They attempt alternative navigation methods to maintain communication.",
      logText: "The crew relies on compass readings and star positions to stay on course.",
      hoverBackground: "img/7.3.jpeg",
      editorNote: "Practical approach; could simulate GPS disruption using real solar data."
    },
    {
      text: "Check reports and calculate position manually.",
      backText: "The captain studies the reports and manually estimates the ship’s position.",
      logText: "With maps and compass in hand, he double-checks their route.",
      hoverBackground: "img/7.4.jpeg",
      editorNote: "Logical; could use EMBRACE system data to verify location safely."
    }
  ],
  next: [7,7,7,7]
},
{
  background: "img/8.jpg",
  rightImage: "img/8s.png",
  hint: "Geomagnetic storms can disrupt satellite signals, leading to navigation and communication failures.",
  intro: "After reaching the port of Brazil, Captain Diego retired to his cabin. On his desk lay a radio, a television, an old phone, and a laptop...",
  question: "All were systems that could be affected by space weather. The relevant data is shown on the right.",
  options: [
    {
      text: "Radio",
      backText: "Radio waves are among the systems most affected by solar storms.",
      logText: "Diego hears static on the radio and smiles. “Now I know why,” he says.",
      hoverBackground: "img/8.1.jpeg",
      editorNote: "Good choice; could demonstrate radio disruption with real solar storm data."
    },
    {
      text: "Television",
      backText: "Satellite broadcasts may experience signal interruptions.",
      logText: "When the screen flickers, Pedro jokes, “The Sun is at it again.”",
      hoverBackground: "img/8.2.jpeg",
      editorNote: "Relevant; could show satellite signal interference using NASA data."
    },
    {
      text: "Phone",
      backText: "Some wireless signals may weaken during strong solar events.",
      logText: "When his old phone loses signal, Diego notes in his journal: “Communication begins in space.”",
      hoverBackground: "img/8.3.jpeg",
      editorNote: "Practical; could link wireless signal loss to actual geomagnetic activity."
    },
    {
      text: "Computer",
      backText: "If connected to satellite or internet links, it may also be affected.",
      logText: "While reviewing reports, Diego notices lag — and once again remembers space weather.",
      hoverBackground: "img/8.4.jpeg",
      editorNote: "Tech focus; could include real-time solar wind effects on internet/GPS."
    }
  ],
  next: [8,8,8,8]
},
{
  background: "img/9.jpg",
  rightImage: "img/9s.png",
  hint: "GOES-R satellites monitor how solar radiation affects communication systems on Earth in real time.",
  intro: "After selling his goods and calculating his profit, the captain and his crew prepared for another voyage.",
  question: "They were tired yet inspired — each of them had learned something new. Solar physics data is displayed on the right.",
  options: [
    {
      text: "Plan a new route and assign crew duties.",
      backText: "The captain sets a new route and assigns duties to the crew.",
      logText: "This time, every route plan includes space weather data.",
      hoverBackground: "img/9.1.jpg",
      editorNote: "Strategic choice; could mark high-risk zones on the map using space weather data."
    },
    {
      text: "Prepare the ship for maintenance and supplies.",
      backText: "The crew organizes maintenance and prepares supplies for the next voyage.",
      logText: "Pedro smiles, saying, “From now on, the Sun is our sailing companion too.”",
      hoverBackground: "img/9.2.jpg",
      editorNote: "Practical approach; integrating NASA forecasts would enhance planning."
    },
    {
      text: "Share lessons learned from the last journey.",
      backText: "Pedro shares the lessons they learned during their last expedition.",
      logText: "He notes, “Space weather matters for sailors too,” writing everything down carefully.",
      hoverBackground: "img/9.3.jpg",
      editorNote: "Good practice; could include solar storm case studies for reference."
    },
    {
      text: "Rest briefly before setting sail again.",
      backText: "The captain and crew decide to rest a bit before setting sail again.",
      logText: "They now understand that space weather affects not only astronauts, but everyone on Earth.",
      hoverBackground: "img/9.4.jpg",
      editorNote: "Balanced choice; could review current solar data before sailing."
    }
  ],
  next: [9,9,9,9]
},
{
  background: "img/10.jpg",
  rightImage: "img/10s.jpg",
  hint: "",
  intro: "The story has come to an end.",
  question: "The journey is over. You can either restart the adventure or return to the main menu.",
  options: [
    {
      text: "The End.",
      backText: "The End.",
      logText: "The End.",
      hoverBackground: "img/10.1.jpg",
      editorNote: "Story concluded; could summarize all NASA and EMBRACE data highlights for a recap."
    },
  ],
  next: [null],
  isFinalQuestion: true
}
];


// ==================== OYUN SİSTEMİ ====================
let currentIndex = 0;
let questionText = document.getElementById("question-text");
let logList = document.getElementById("log-list");

function renderScene(index) {
    // Eğer rapor ekranındaysak, önce DOM'u sıfırla
    const storyArea = document.querySelector('.story-area');
    if (storyArea && storyArea.querySelector('.game-report')) {
        resetGameDOM();
    }
    
    const scene = storyData[index];
    if (!scene) {
        // Oyun bittiğinde rapor göster
        endGame();
        return;
    }

    currentIndex = index;

    // İlk sahnede oyunu başlat (son soruda başlatma)
    if (index === 0) {
        startGame();
    }

    // Son soruda soru zamanlayıcısını başlatma
    if (!scene.isFinalQuestion) {
        startQuestionTimer();
    }

    // 📷 Arka planı sahneye göre ayarla
    if (scene.background) {
        document.body.style.backgroundImage = `url('${scene.background}')`;
    }

    const leftImage = document.getElementById("left-image");
    const rightImage = document.getElementById("right-image");

    if (leftImage && scene.leftImage) {
        leftImage.src = scene.leftImage;
    }

    if (rightImage && scene.rightImage) {
        rightImage.src = scene.rightImage;
    }

    if (questionText) {
        questionText.textContent = scene.question;
    }
    
    const optionsContainer = document.querySelector(".options");
    if (optionsContainer) {
        optionsContainer.innerHTML = "";
    }

    scene.options.forEach((opt, i) => {
        const card = document.createElement("div");
        card.classList.add("option-card");

        // Son soru için özel stil
        if (scene.isFinalQuestion) {
            card.style.background = "linear-gradient(135deg, #ff914d, #ff6b35)";
            card.style.border = "2px solid #fff";
        }

        const inner = document.createElement("div");
        inner.classList.add("option-inner");

        const front = document.createElement("div");
        front.classList.add("option-front");
        front.textContent = opt.text;
        
        // Son soru için özel front stil
        if (scene.isFinalQuestion) {
            front.style.background = "linear-gradient(135deg, #ff914d, #ff6b35)";
            front.style.color = "#fff";
            front.style.fontWeight = "bold";
            front.style.fontSize = "18px";
        }

        const back = document.createElement("div");
        back.classList.add("option-back");
        back.textContent = opt.backText;
        
        // Son soru için özel back stil
        if (scene.isFinalQuestion) {
            back.style.background = "linear-gradient(135deg, #e07b35, #d2691e)";
            back.style.color = "#fff";
        }

        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);
        
        if (optionsContainer) {
            optionsContainer.appendChild(card);
        }

        const tooltipText = document.getElementById("tooltip-text");
        if (tooltipText) {
            tooltipText.textContent = scene.hint || "Bu sahne için ipucu bulunamadı.";
        }

        // 🎯 Tıklama olayı
        card.addEventListener("click", () => {
            // Son soruda zaman hesaplama ve kayıt yapma
            if (!scene.isFinalQuestion) {
                const timeSpent = getQuestionTime();
                saveAnswer(currentIndex, opt.text, i, timeSpent);
            }
            
            if (opt.logText) {
                addToTypingQueue(opt.logText);
            }
            
            const nextScene = scene.next ? scene.next[i] : null;
            if (nextScene !== null && nextScene !== undefined) {
                renderScene(nextScene);
            } else {
                // Oyun bitti - son soruya tıklandığında direkt rapor göster
                if (scene.isFinalQuestion) {
                    endGame();
                } else {
                    // Normal oyun bitişi
                    endGame();
                }
            }
        });

        // 🖱️ Hover olayı – arka planı değiştir (son soruda değiştirme)
        if (!scene.isFinalQuestion) {
            card.addEventListener("mouseenter", () => {
                if (opt.hoverBackground) {
                    document.body.style.backgroundImage = `url('${opt.hoverBackground}')`;
                }
            });

            card.addEventListener("mouseleave", () => {
                if (scene.background) {
                    document.body.style.backgroundImage = `url('${scene.background}')`;
                }
            });
        }
    });

    // 📖 Log'ları sadece bir kere yaz (son soruda yazma)
    if (scene.logs && !scene._logsShown && !scene.isFinalQuestion) {
        scene.logs.forEach(log => {
            addToTypingQueue(log);
        });
        scene._logsShown = true;
    }

    // 📘 Giriş metni varsa (ilk sahne)
    if (scene.intro && !scene._introShown && !scene.isFinalQuestion) {
        addToTypingQueue(scene.intro);
        scene._introShown = true;
    }
}

// DOM'u sıfırla
function resetGameDOM() {
    const storyArea = document.querySelector('.story-area');
    const storyLog = document.querySelector('.story-log');
    
    if (storyArea) {
        storyArea.innerHTML = `
            <div class="question-container">
                <h2 id="question-text">Soru yükleniyor...</h2>
                <div class="options">
                    <!-- Seçenekler buraya dinamik olarak eklenecek -->
                </div>
            </div>
            <div class="image-box">
                <img id="left-image" src="" alt="Sol Görsel">
            </div>
            <div class="image-box">
                <img id="right-image" src="" alt="Sağ Görsel">
            </div>
        `;
    }
    
    if (storyLog) {
        storyLog.innerHTML = `
            <h3>Story Log</h3>
            <ul id="log-list"></ul>
        `;
    }
    
    // Gerekli elementleri yeniden seç
    questionText = document.getElementById("question-text");
    logList = document.getElementById("log-list");
    
    // Arka planı sıfırla
    document.body.style.backgroundImage = '';
}

// Oyunu başlat
if (questionText) {
    renderScene(currentIndex);
}