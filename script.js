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
                <h1>🎮 Oyun Tamamlandı!</h1>
                <div class="report-stats">
                    <div class="stat-item">
                        <h3>Toplam Süre</h3>
                        <div class="stat-value">${formatTime(report.totalTime)}</div>
                    </div>
                    <div class="stat-item">
                        <h3>Toplam Soru</h3>
                        <div class="stat-value">${report.totalAnswers}</div>
                    </div>
                    <div class="stat-item">
                        <h3>Soru Başına Ortalama</h3>
                        <div class="stat-value">${formatTime(report.averageTimePerQuestion)}</div>
                    </div>
                </div>
                <div class="answers-details">
                    <h3>📊 Detaylı Karne</h3>
                    <div class="answers-list">
                        ${report.playerAnswers.map((answer, index) => `
                            <div class="answer-item">
                                <div class="answer-header">
                                    <div class="answer-number">Soru ${index + 1}</div>
                                    <div class="answer-time">⏱️ ${formatTime(answer.timeSpent)}</div>
                                </div>
                                <div class="question-text">${answer.questionText}</div>
                                <div class="selected-answer">
                                    <strong>Verdiğin Cevap:</strong> ${answer.selectedOption}
                                </div>
                                <div class="editor-note">
                                    <strong>Editör Notu:</strong> ${answer.editorNote}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="report-actions">
                    <button onclick="restartGame()" class="play-button">🔄 Tekrar Oyna</button>
                    <button onclick="goToMainMenu()" class="play-button">🏠 Ana Menü</button>
                </div>
            </div>
        `;
        
        storyArea.innerHTML = reportHTML;
        
        // Log alanına da basit rapor ekle
        storyLog.innerHTML = `
            <h3>Oyun Özeti</h3>
            <p>Toplam Süre: ${formatTime(report.totalTime)}</p>
            <p>Cevaplanan Soru: ${report.totalAnswers}</p>
            <p>Ortalama Süre: ${formatTime(report.averageTimePerQuestion)}</p>
        `;
    }
}

// Zaman formatı
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds} saniye`;
    } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes} dakika ${remainingSeconds} saniye`;
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

// ==================== OYUN VERİLERİ ====================
const storyData = [
  {
    background: "img/1.jpg",
    rightImage: "img/1s.jpg",
    hint: "Kaptan Diego’nun “hava durumunu kontrol etmesi” yalnızca rüzgâr ve yağmur için değil, Güneş kaynaklı uzay havası olaylarını da kapsar. Bu, modern denizcilikte gerçek bir uygulamadır.",
    intro: "Kaptan Diego ve yardımcısı Pedro, İspanya’dan Brezilya’ya uzun bir deniz yolculuğuna çıkacaktır. Güneş’ten gelen parçacık fırtınalarının uydu iletişimi ve seyir sistemlerini etkileyebileceğini radyo dinlerken duydular.",
    question: "Diego, NOAA’nın SWPC sitesindeki uzay hava durumu raporlarını inceledi.",
    options: [
      {
        text: "Rota planlarlar.",
        backText: "Uzay hava durumu raporuna bakarak rota planlarlar.",
        logText: "Diego, Güneş aktivitelerini dikkatle inceler ve rotayı daha güvenli bir bölgede ilerleyecek şekilde ayarlar. Bu önlem, ileride yaşayacakları sorunlarda büyük fark yaratacaktır. Gemiyi hazırlayıp denize açılırlar.",
        hoverBackground: "img/1.1.jpg",
        editorNote: ""
      },
      {
        text: "Direkt yola çıkarlar.",
        backText: "Bir hazırlık yapmadan direkt yola çıkarlar",
        logText: "Zaman kaybetmek istemeyen kaptan, raporlara bakmadan yola koyulur. Ancak Pedro’nun aklında “ya Güneş fırtınası olursa?” sorusu kalır. Geminin pusulası rotayı gösterirken, deniz onları beklemektedir.",
        hoverBackground: "img/1.2.jpg",
        editorNote: ""
      },
      {
        text: "Ekipman kontrolü yaparlar.",
        backText: "Edindiği bilgilere göre ekipman kontrollerini yaparlar.",
        logText: "Pedro, iletişim cihazlarını test eder, Diego ise GPS sisteminin yedek bağlantılarını kontrol eder. Her şey hazırdır; bilinçli bir ekiple yolculuk başlar.",
        hoverBackground: "img/1.3.jpg",
        editorNote: ""
      },
      {
        text: "Erzak kontrolü yaparlar.",
        backText: "Öğrendiği bilgilere göre erzaklarını düzenlerler.",
        logText: "Diego, olası bir fırtına veya yön kaybına karşı gemideki erzakı artırır. Bu temkinli davranış ileride işe yarayacaktır. Hazırlıklar tamamlanır ve gemi limandan ayrılır.",
        hoverBackground: "img/1.4.jpg",
        editorNote: ""
      }
    ],
    next: [1,1,1,1]
  },
    {
    background: "img/2.jpg",
    rightImage: "img/2s.jpg",
    hint: "X sınıfı patlamalar, milyarlarca hidrojen bombası enerjisine eşdeğerdir ve radyo iletişimi, GPS, elektrik şebekeleri gibi sistemlerde kesintilere yol açar.",
    intro: "Yolculuk sırasında televizyon izlerken “X sınıfı güneş patlaması” uyarısı yapıldı; Güneş’ten gelen yüksek enerjili parçacıklar geminin GPS’ini bozdu, radyo sinyallerini kesti ve yön bulmayı zorlaştırdı. ",
    question: "Bu durum, 2003’te tanık olduğu X45 seviyesindeki süper patlamayı andırıyordu.",
    options: [
      {
        text: "Eski haritayı kullanırlar.",
        backText: "Gemide buldukları eski bir haritayı kullanırlar.",
        logText: "Diego, sandıktan çıkardığı haritayı açar ve eski denizcilerin rotalarını hatırlayarak yön tayini yapar. Ancak fırtına nedeniyle haritadaki bazı noktalar belirsizdir.",
        hoverBackground: "img/2.1.jpg",
        editorNote: ""
      },
      {
        text: "Yıldızlara göre yol alırlar.",
        backText: "Yıldızların konumlarına göre hareket eder.",
        logText: "Pedro geceleri gökyüzüne bakarak yön bulmaya çalışır. Fakat bulutlar sıklaştığında yıldızlar görünmez olur. Gemide endişeli bir sessizlik hakimdir.",
        hoverBackground: "img/2.2.jpeg",
        editorNote: ""
      },
      {
        text: "Frekansın çekmesini bekler.",
        backText: "Radyo frekansı çekene kadar beklerler.",
        logText: "Kaptan sabırla radyo frekansının yeniden gelmesini bekler. Ancak bekleyiş uzar ve mürettebatın morali bozulur. Bu sırada kuzeybatıdan soğuk bir rüzgâr eser.",
        hoverBackground: "img/2.3.jpg",
        editorNote: ""
      },
      {
        text: "Konumlarını tahmin ederler.",
        backText: "Suyun derinliğini haritayla kullanarak konumlarını tahmin eder.",
        logText: "Pedro, suyun derinliğini ölçüp eski kayıtlarla karşılaştırır. Tahminleri onları kuzey kıyılarına yönlendirir.",
        hoverBackground: "img/2.4.jpg",
        editorNote: ""
      }
    ],
    next: [2,2,2,2]
  },
  {
    background: "img/3.jpg",
    rightImage: "img/3s.png",
    hint: "Kanada Uzay Hava Tahmin Merkezi, Dünya Meteoroloji Örgütü’nün bir parçasıdır ve ülke genelinde jeomanyetik fırtınaları izler.",
    intro: "Sonuç olarak yönlerini kaybeden  Diego ve Pedro, sonunda Kanada’ya ulaştılar.",
    question: "Gemiyi güvenli bir limana demirleyip sorun çözülene kadar Kanadada kalmaya karar verdiler ve kanadayı gezmeye karar verdiler",
    options: [
      {
        text: "Niagara Şelalesi",
        backText: "Niagara Şelalesi gitmeliler.",
        logText: "Şelalenin gücünü izlerken doğanın enerjisinin Güneş’in gücüne benzediğini düşünürler. Bu düşünce Pedro’da yeni bir merak uyandırır.",
        hoverBackground: "img/3.1.png",
        editorNote: ""
      },
      {
        text: "Kıyı Dağları",
        backText: "Kıyı Dağları gitmeliler.",
        logText: "Dağların zirvesinde auroraları görebileceklerini duyarlar. Pedro’nun gözleri parıldar, o artık uzay havasını yerinde incelemek istemektedir.",
        hoverBackground: "img/3.2.jpg",
        editorNote: ""
      },
      {
        text: "Ottawa",
        backText: "Ottawa'ya gitmeliler.",
        logText: "Başkentte Kanada Uzay Hava Tahmin Merkezi’ni ziyaret ederler. Bilim insanlarından Güneş fırtınalarının Dünya üzerindeki etkilerini öğrenirler.",
        hoverBackground: "img/3.3.jpg",
        editorNote: ""
      },
      {
        text: "Old Quebec",
        backText: "Old Quebec gitmeliler.",
        logText: "Tarihi sokaklarda dolaşırken bir kafede radyodan aurora uyarısı duyarlar. Bu haber onları kuzeye, yeni bir gözleme doğru yönlendirir.",
        hoverBackground: "img/3.4.jpg",
        editorNote: ""
      }
    ],
    next: [3,3,3,3]
  },
  {
    background: "img/4.jpg",
    rightImage: "img/4s.png",
    hint: "Auroralar, Güneş rüzgârlarının Dünya’nın manyetosferiyle etkileşmesiyle oluşur ve uzay havası olaylarının en görsel örneklerindendir.",
    intro: "Gittikleri yerde gökyüzü aniden yeşil ve mor renklere büründü. Pedro heyecanla bağırdı: “Auroralar!” Kaptan Diego, kuzey ışıklarının nasıl oluştuğunu merak etti.",
    question: "Pedro hemen açıkladı: “Bu, Güneş’ten gelen parçacıkların Dünya’nın manyetik alanıyla çarpışması sonucu ortaya çıkan bir doğa harikasıdır.”",
    options: [
      {
        text: "Anın tadını çıkarır.",
        backText: "Çimlere uzanıp anın tadını çıkarır.",
        logText: "Sessizce gökyüzüne bakarlar, doğanın büyüsünü hissederler. Diego bu görüntünün ardındaki bilimi merak eder.",
        hoverBackground: "img/4.1.jpeg",
        editorNote: ""
      },
      {
        text: "Gökyüzündeki renkleri hayranlıkla izler.",
        backText: "Çimlere uzanıp gökyüzündeki yıldızları izler.",
        logText: "Pedro kamerayı çıkarır, görüntüleri kaydeder. “Bunu EMBRACE merkezine göndermeliyiz,” der.",
        hoverBackground: "img/4.2.jpg",
        editorNote: ""
      },
      {
        text: "Sessizce etrafı seyredip gülümser.",
        backText: "Sessizce etrafı seyredip gülümser.",
        logText: "Kaptan bu huzurlu anı yaşarken aklında hâlâ bozuk GPS vardır. “Dönmeden önce sistemi düzeltmeliyiz,” diye düşünür.",
        hoverBackground: "img/4.3.jpg",
        editorNote: ""
      },
      {
        text: "Fazla oyalanmayıp gemilerine dönerler.",
        backText: "Zaman kaybetmeyip gemilerine dönerler.",
        logText: "Renkler sönmeye başladığında Pedro, “Yola devam etmeden önce sistemi kontrol etmeliyiz,” der.",
        hoverBackground: "img/4.4.jpg",
        editorNote: ""
      }
    ],
    next: [4,4,4,4]
  },
  {
    background: "img/5.jpg",
    rightImage: "img/5s.png",
    hint: "EMBRACE, Brezilya Uzay Araştırmaları Enstitüsü (INPE) tarafından yürütülür ve Güneş aktivitelerini gerçek zamanlı takip eder.",
    intro: "Sistem arızası çözülmüştü. Diego, rotayı Brezilya’ya çevirmeden önce EMBRACE sisteminden uzay hava durumu raporlarını kontrol etti. ",
    question: "Brezilya Uzay Hava Durumu Programı, Güneş’ten gelen verileri analiz edip bölgesel etkileri tahmin ediyordu. Pedro ise hâlâ X sınıfı patlamaların tekrar herhangi bir arızaya sebep olabileceğini düşünüyordu.",
    options: [
      {
        text: "Uzay hava durumunu inceler.",
        backText: "Diego, seyir güvenliği için uzay hava durumunu inceler.",
        logText: "Son verilere göre Güneş yeniden aktifleşmektedir. Kaptan dikkatli olma kararı alır",
        hoverBackground: "img/5.1.jpeg",
        editorNote: ""
      },
      {
        text: "X sınıfı patlamaların etkileri hakkında merakla sorular sorar.",
        backText: "Pedro, X sınıfı patlamaların etkileri hakkında merakla sorular sorar.",
        logText: "“Bir patlama daha olursa GPS yine bozulur mu?” diye sorar. Diego raporları incelerken başını sallar.",
        hoverBackground: "img/5.2.jpeg",
        editorNote: ""
      },
      {
        text: "Güneş aktivitelerinin Dünya üzerindeki etkilerini tartışır.",
        backText: "İkisi, Güneş aktivitelerinin Dünya üzerindeki etkilerini tartışır.",
        logText: "Konuşmaları, teknolojinin uzay havasına ne kadar bağımlı olduğunu fark etmelerini sağlar.",
        hoverBackground: "img/5.3.jpeg",
        editorNote: ""
      },
      {
        text: "Raporları inceleyip rotayı güvenli bölgeye göre belirler.",
        backText: "Kaptan ve mürettebat, raporları inceleyip rotayı güvenli bölgeye göre belirler.",
        logText: "Planlarını yeniden yaparlar ve gemiyi hazırlamaya başlarlar.",
        hoverBackground: "img/5.4.jpg",
        editorNote: ""
      }
    ],
    next: [5,5,5,5]
  },
  {
    background: "img/6.jpg",
    rightImage: "img/5s.png",
    hint: "Bu olay, hikâyedeki geçiş sahnesidir; uzay havası temasıyla doğrudan bağlantılı değildir.",
    intro: "Okyanusta ilerlerken erzakları tükenmeye başladı.",
    question: "Uzakta bir ada belirdi ama oraya gitmek riskliydi.",
    options: [
      {
        text: "Tehlikeyi düşünüp rotalarına devam ederler.",
        backText: "Adanın tehlikeli olabileceğini düşünüp rotalarına devam ederler.",
        logText: "Açlık zorlasa da güvenliği tercih ederler. Ancak GPS sinyali yine zayıflar.",
        hoverBackground: "img/6.1.jpg",
        editorNote: ""
      },
      {
        text: "Risk alıp adaya yaklaşırlar.",
        backText: "Risk alıp adaya yanaşarak yiyecek aramaya karar verirler.",
        logText: "Adaya çıktıklarında sinyallerin yeniden karıştığını fark ederler. Güneş aktivitesi tekrar artıyor gibidir.",
        hoverBackground: "img/6.2.jpg",
        editorNote: ""
      },
      {
        text: "Kalan son erzakları paylaşırlar.",
        backText: "Gemi içinde kalan son erzakları dikkatle paylaşırlar.",
        logText: "Birlikte dayanışma gösterirler. Pedro, “Yine GPS bozuldu,” der endişeyle.",
        hoverBackground: "img/6.3.jpeg",
        editorNote: ""
      },
      {
        text: "Adaı uzaktan gözlemlerler.",
        backText: "Adanın güvenli olup olmadığını uzaktan gözlemlemeye çalışırlar.",
        logText: "Dürbünle adaya bakarken iletişim cihazlarında parazit sesleri duyarlar.",
        hoverBackground: "img/6.4.jpeg",
        editorNote: ""
      }
    ],
    next: [6,6,6,6]
  },
  {
    background: "img/7.jpg",
    rightImage: "img/7s.png",
    hint: "Bu olay, hikâyedeki geçiş sahnesidir; uzay havası temasıyla doğrudan bağlantılı değildir.",
    intro: "Brezilya’ya yaklaşırken geminin GPS sistemi tekrar hata vermeye başladı.",
    question: "Kaptan, bunun nedenini öğrenmek için yardımcısına döndü: “Yine güneş fırtınası olabilir mi?” diye sordu. Pedro onayladı.",
    options: [
      {
        text: "Arızanın güneş fırtınsaı yüzünden olduğunu fark eder.",
        backText: "Kaptan, GPS arızasının Güneş fırtınasından kaynaklandığını fark eder.",
        logText: "Diego artık bu olayları tanıyordur. “Bu bir jeomanyetik fırtına,” der.",
        hoverBackground: "img/7.1.jpeg",
        editorNote: ""
      },
      {
        text: "Jeomanyetik fırtınaların navigasyon sistemlerini etkileyebileceğini açıklar.",
        backText: "Pedro, jeomanyetik fırtınaların navigasyon sistemlerini etkileyebileceğini açıklar.",
        logText: "Pedro öğrendiklerini hatırlayıp açıklama yapar, Diego onaylar.",
        hoverBackground: "img/7.2.jpeg",
        editorNote: ""
      },
      {
        text: "İletişimi korumak için yön bulma yöntemleri dener.",
        backText: "Mürettebat, iletişimi korumak için alternatif yön bulma yöntemleri dener.",
        logText: "Ekip, pusula ve yıldız gözlemiyle ilerlemeye çalışır.",
        hoverBackground: "img/7.3.jpeg",
        editorNote: ""
      },
      {
        text: "Raporları inceleyip geminin konumunu belirlemeye çalışır.",
        backText: "Kaptan, raporları inceleyip geminin konumunu manuel olarak belirlemeye çalışır.",
        logText: "Harita ve pusula yardımıyla tekrar kontrol yapar.",
        hoverBackground: "img/7.4.jpeg",
        editorNote: ""
      }
    ],
    next: [7,7,7,7]
  },
  {
    background: "img/8.jpg",
    rightImage: "img/8s.png",
    hint: "Jeomanyetik fırtınalar, uyduların sinyallerini bozarak navigasyon sistemlerinde hatalara yol açabilir.",
    intro: "Kaptan Brezilya limanına vardıktan sonra kamarasına çekildi. Dinlenirken masasında duran cihazlara baktı. Bir radyo, bir televizyon, eski bir telefon ve dizüstü bilgisayar... ",
    question: "Hepsi, uzay havasının etkileyebileceği sistemlerdi.",
    options: [
      {
        text: "Radyo",
        backText: "Radyo dalgaları, güneş fırtınalarından en çok etkilenen sistemlerdendir.",
        logText: "Diego radyoda parazit sesi duyar ve gülümser. “Artık nedenini biliyorum,” der.",
        hoverBackground: "img/8.1.jpeg",
        editorNote: ""
      },
      {
        text: "Televizyon",
        backText: "Uydu yayınları sinyal kesintisi yaşayabilir.",
        logText: "Ekran bir an karardığında Pedro, “Güneş yine devrede,” diye şaka yapar.",
        hoverBackground: "img/8.2.jpeg",
        editorNote: ""
      },
      {
        text: "Telefon",
        backText: "Bazı kablosuz sinyaller zayıflayabilir.",
        logText: "Eski telefon sinyal bulamayınca Diego defterine not alır: “İletişim uzayla başlar.”",
        hoverBackground: "img/8.3.jpeg",
        editorNote: ""
      },
      {
        text: "Bilgisayar",
        backText: "Uydu veya internet bağlantısı varsa etkilenebilir.",
        logText: "Diego raporları incelerken sinyal gecikir, yine uzay havasını hatırlar.",
        hoverBackground: "img/8.4.jpeg",
        editorNote: ""
      }
    ],
    next: [8,8,8,8]
  },
  {
    background: "img/9.jpg",
    rightImage: "img/9s.png",
    hint: "GOES-R uyduları, Güneş’ten gelen radyasyonun Dünya’daki iletişim sistemlerine etkilerini gerçek zamanlı izler.",
    intro: "Malını satıp kârını hesaplayan kaptan, mürettebatla birlikte yeniden denize açılmak üzere hazırlık yaptı.",
    question: "Yorgunluk ve özlem içindeydiler, ama her biri yeni şeyler öğrenmişti.",
    options: [
      {
        text: "Yeni sefer için rota belirlenir ve ekibe görev dağıtımı yapar.",
        backText: "Kaptan, yeni sefer için rotayı belirler ve ekibe görev dağıtımı yapar.",
        logText: "Bu kez her rota planında uzay hava durumuna da yer verir.",
        hoverBackground: "img/9.1.jpg",
        editorNote: ""
      },
      {
        text: "Gemiyi sefer öncesi bakım ve erzak hazırlığı için düzenler.",
        backText: "Mürettebat, gemiyi sefer öncesi bakım ve erzak hazırlığı için düzenler.",
        logText: "Pedro, “Artık sadece deniz değil, Güneş de yol arkadaşımız,” der.",
        hoverBackground: "img/9.2.jpg",
        editorNote: ""
      },
      {
        text: "Önceki yolculuktan edindikleri bilgileri paylaşır.",
        backText: "Pedro, önceki yolculuktan edindikleri bilgileri paylaşır.",
        logText: "Uzay havası denizciler için de önemli,” diyerek notlar tutar.",
        hoverBackground: "img/9.3.jpg",
        editorNote: ""
      },
      {
        text: "Kısa bir dinlenmeden sonra yola çıkmaya karar verir.",
        backText: "Kaptan ve mürettebat, kısa bir dinlenmeden sonra yola çıkmaya karar verir.",
        logText: "Uzay hava durumu sadece astronotları değil, dünyadaki herkesi etkiler.”",
        hoverBackground: "img/9.4.jpg",
        editorNote: ""
      }
    ],
    next: [9,9,9,9]
  },
  {
    background: "img/10.jpg",
    rightImage: "img/10s.jpg",
    hint: "",
    intro: "Hikaye Bitmiştir.",
    question: "Hikaye bitti. Dilersen yeniden başlayıp dilersen menüye dönebilirsin.",
    options: [
      {
        text: "Bitti.",
        backText: "Bitti.",
        logText: "Bitti.",
        hoverBackground: "img/10.1.jpg",
        editorNote: ""
      },
    ],
    next: [null], // null = oyun bitişi
    isFinalQuestion: true // Bu sorunun karneye dahil edilmemesi için işaret
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
            <h3>Hikaye Günlüğü</h3>
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