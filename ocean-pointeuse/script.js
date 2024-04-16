function processFile() {
    var fileInput = document.getElementById('fileInput');
    var file = fileInput.files[0];

    var reader = new FileReader();

    reader.onload = function (e) {
        var content = e.target.result;
        var lines = content.split('\n');

        var stats = {
            primeEtMontee: 0,
            primesSansMontee: 0,
            aucunPrimeNiMontee: 0,
            primePossibleMontee: 0,
            heuresNulles: 0
        };

        // Trier les lignes par grade avant de les traiter
        lines.sort(function(a, b) {
            var regexGrade = /\[(.*?)\]/;
            var gradeA = a.match(regexGrade)[1];
            var gradeB = b.match(regexGrade)[1];
            return compareGrades(gradeA, gradeB);
        });

        var outputDiv = document.getElementById('output');
        outputDiv.innerHTML = '';
        
        var outputTimes ="";
        var currentGrade = '';
        lines.forEach(function (line) {
            var result = processLine(line);
            console.log(result);
            if(currentGrade !== line.match(/\[(.*?)\]/)[1]){
                outputTimes += '<br>';
                currentGrade = line.match(/\[(.*?)\]/)[1];
            }
            outputTimes += result + '<br>';
            updateStats(result, stats);
        });
        outputDiv.innerHTML += generateStatsOutput(stats);
        outputDiv.innerHTML += outputTimes;
        
        
    };

    reader.readAsText(file);
}

function updateStats(result, stats) {
    if (result.includes("Prime : [✓]</span>, <span style='color: green;'>Montée : [✓]")) {
        stats.primeEtMontee++;
    } 
    if (result.includes("Prime : [✓]</span>, <span style='color: red;'>Montée : [X]")) {
        stats.primesSansMontee++;
    } 
    if (result.includes("Prime : [X]</span>, <span style='color: red;'>Montée : [X]")) {
        stats.aucunPrimeNiMontee++;
    } 
    if (result.includes("Prime : [✓]</span>, <span style='color: #3464eb;'>Montée : [&nbsp;&nbsp;]")) {
        stats.primePossibleMontee++;
    } 
    if (result.includes(" 0 heures")) {
        stats.heuresNulles++;
    }
}

function generateStatsOutput(stats) {
    return "<b>Statistiques :</b><br>" +
           "Employés avec prime et montée : " + stats.primeEtMontee + "<br>" +
           "Employés avec prime sans montée : " + stats.primesSansMontee + "<br>" +
           "Employés sans prime ni montée : " + stats.aucunPrimeNiMontee + "<br>" +
           "Employés avec prime et possible montée : " + stats.primePossibleMontee + "<br>" +
           "Employés avec 0 heures : " + stats.heuresNulles + "<br><br>";
}


function compareGrades(gradeA, gradeB) {
    var gradeOrder = {
        "ESSAI": 0,
        "SEC": 1,
        "AMB": 2,
        "BRD": 3,
        "ADS": 4,
        "INF": 5,
        "INF-I": 6,
        "PRTC": 7,
        "INT": 8,
        "MED": 9,
        "MED-I": 10;
        "MED-U": 11,
        "MED-C": 12,
        "RESP-E": 13,
        "CADRE": 14,
        "CO-DIR": 15,
        "DIR": 16
    };

    if (gradeOrder[gradeA] < gradeOrder[gradeB]) {
        return -1;
    }
    if (gradeOrder[gradeA] > gradeOrder[gradeB]) {
        return 1;
    }
    return 0;
}


function processLine(line) {
    var regexName = /\] ([^\s]+ [^\s]+)/;

    var regexGrade = /\[(.*?)\]/;
    var regexTime = /(\d+ jours, )?(\d+ heures, \d+ minutes et \d+ secondes)/;

    var nameMatch = line.match(regexName);
    var gradeMatch = line.match(regexGrade);
    var timeMatch = line.match(regexTime);

    if (nameMatch && gradeMatch && timeMatch) {
        var name = nameMatch[1];
        var grade = gradeMatch[1];
        var timeString = timeMatch[0];
        var days = 0;
        var hours = 0;
        var minutes = 0;

        // Extraire les jours, les heures et les minutes
        var daysMatch = timeString.match(/(\d+) jours/);
        var hoursMatch = timeString.match(/(\d+) heures/);
        var minutesMatch = timeString.match(/(\d+) minutes/);
        if (daysMatch) {
            days = parseInt(daysMatch[1]);
        }
        if (hoursMatch) {
            hours = parseInt(hoursMatch[1]);
        }
        if (minutesMatch) {
            minutes = parseInt(minutesMatch[1]);
        }

        // Convertir les jours et les heures en minutes
        var totalMinutes = days * 24 * 60 + hours * 60 + minutes;

        var roundedTime = roundToHalfHour(totalMinutes);
        var formattedTime = formatTime(roundedTime);

        var primeEligible = checkPrimeEligibility(grade, roundedTime);
        var promotionEligible = checkPromotionEligibility(grade, roundedTime);

        if (primeEligible) {
            if (promotionEligible) {
                return "<span style='color: green;'>Prime : [✓]</span>, <span style='color: green;'>Montée : [✓]</span> - [" + grade + "] " + name + " : " + formattedTime;
            } else if (grade ==="ESSAI"|| grade ==="SEC"|| grade ==="AMB") {
                return "<span style='color: green;'>Prime : [✓]</span>, <span style='color: red;'>Montée : [X]</span> &nbsp;- [" + grade + "] " + name + " : " + formattedTime;
            } else{
                return "<span style='color: green;'>Prime : [✓]</span>, <span style='color: #3464eb;'>Montée : [&nbsp;&nbsp;]</span> &nbsp;- [" + grade + "] " + name + " : " + formattedTime;
            }
        } else {
            return "<span style='color: red;'>Prime : [X]</span>, <span style='color: red;'>Montée : [X]</span> - [" + grade + "] " + name + " : " + formattedTime;
        }
    } else {
        // Ligne sans prise de service
        if (gradeMatch && nameMatch) {
            return "<span style='color: red;'>Prime : [X]</span>, <span style='color: red;'>Montée : [X] - [" + gradeMatch[1] + "] " + nameMatch[1] + " : 0 heures</span>";
        } else {
            return "<span style='color: red;'>Erreur de format de ligne</span>";
        }
    }
}




function roundToHalfHour(time) {
    var halfHour = 30;
    return Math.ceil(time / halfHour) * halfHour;
}

function formatTime(time) {
    var hours = Math.floor(time / 60);
    var minutes = time % 60;

    var formattedTime = "";
    if (hours > 0) {
        formattedTime += hours + " heures";
    }

    return formattedTime;
}

function checkPrimeEligibility(grade, time) {
    switch (grade) {
        case "ESSAI":
        case "SEC":
        case "AMB":
        case "BRD":
            return time >= 10 * 60; // 10 heures
        case "ADS":
        case "INF":
        case "INF-I":
        case "PRTC":
        case "INT":
        case "MED":
        case "MED-I":
        case "MED-U":
        case "MED-C":
        case "RESP-E":
        case "CADRE":
        case "CO-DIR":
        case "DIR":
            return time >= 12 * 60; // 12 heures
        default:
            return false;
    }
}

function checkPromotionEligibility(grade, time) {
    switch (grade) {
        case "ESSAI":
            return time >= 12 * 60; // 12 heures
        case "SEC":
        case "AMB":
            return time >= 15 * 60; // 15 heures
        default:
            return false;
    }
}
