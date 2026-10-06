const SUPABASE_URL = "https://xeupoixowhvfojplvjhh.supabase.co";

const SUPABASE_KEY = "sb_publishable_Mjuv8JnyEVGa317QyZgkZg_ZmfzV78b";


// =========================
// ПОДКЛЮЧЕНИЕ К SUPABASE
// =========================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================
// ЭЛЕМЕНТЫ
// =========================

const board = document.getElementById("board");

const movesElement = document.getElementById("moves");
const timerElement = document.getElementById("timer");
const bestElement = document.getElementById("best");

const restartButton =
    document.getElementById("restart");

const loginScreen =
    document.getElementById("loginScreen");

const game =
    document.getElementById("game");

const playerNameInput =
    document.getElementById("playerName");

const loginButton =
    document.getElementById("loginButton");

const playerElement =
    document.getElementById("player");

const winScreen =
    document.getElementById("winScreen");

const winnerNameElement =
    document.getElementById("winnerName");

const finalMoves =
    document.getElementById("finalMoves");

const finalTime =
    document.getElementById("finalTime");

const playAgainButton =
    document.getElementById("playAgain");

const ratingScreen =
    document.getElementById("ratingScreen");

const ratingList =
    document.getElementById("ratingList");

const showRatingButton =
    document.getElementById("showRating");

const winRatingButton =
    document.getElementById("winRating");

const closeRatingButton =
    document.getElementById("closeRating");

const newPlayerButton =
    document.getElementById("newPlayer");


// =========================
// ИГРА
// =========================

const symbols = [
    "🍎",
    "🍌",
    "🍓",
    "🍉",
    "🍇",
    "🍊",
    "🥝",
    "🍒"
];

let firstCard = null;
let secondCard = null;

let lockBoard = false;

let moves = 0;
let matches = 0;

let seconds = 0;

let timer = null;


// =========================
// ВХОД
// =========================

function startWithName() {

    const name =
        playerNameInput.value.trim();

    if (name === "") {

        playerNameInput.focus();

        return;
    }

    localStorage.setItem(
        "playerName",
        name
    );

    playerElement.textContent = name;
    winnerNameElement.textContent = name;

    loginScreen.style.display = "none";
    game.style.display = "block";

    startGame();
}


// =========================
// НОВАЯ ИГРА
// =========================

function startGame() {

    clearInterval(timer);

    moves = 0;
    matches = 0;
    seconds = 0;

    firstCard = null;
    secondCard = null;

    lockBoard = false;

    movesElement.textContent = "0";
    timerElement.textContent = "00:00";

    winScreen.style.display = "none";
    ratingScreen.style.display = "none";

    let deck = [
        ...symbols,
        ...symbols
    ];

    deck.sort(
        () => Math.random() - 0.5
    );

    board.innerHTML = "";

    deck.forEach(symbol => {

        const card =
            document.createElement("div");

        card.classList.add("card");

        card.innerHTML = `
            <div class="card-inner">

                <div class="card-back">
                    ?
                </div>

                <div class="card-front">
                    ${symbol}
                </div>

            </div>
        `;

        card.dataset.symbol = symbol;

        card.addEventListener(
            "click",
            () => flipCard(card)
        );

        board.appendChild(card);

    });

    startTimer();

    loadBestScore();
}


// =========================
// ОТКРЫТИЕ КАРТЫ
// =========================

function flipCard(card) {

    if (lockBoard) return;

    if (card === firstCard) return;

    if (
        card.classList.contains("matched")
    ) {
        return;
    }

    card.classList.add("flipped");

    if (!firstCard) {

        firstCard = card;

        return;
    }

    secondCard = card;

    moves++;

    movesElement.textContent = moves;

    checkMatch();
}


// =========================
// ПРОВЕРКА ПАРЫ
// =========================

function checkMatch() {

    const isMatch =
        firstCard.dataset.symbol ===
        secondCard.dataset.symbol;

    if (isMatch) {

        firstCard.classList.add(
            "matched"
        );

        secondCard.classList.add(
            "matched"
        );

        matches++;

        resetCards();

        checkWin();

    } else {

        lockBoard = true;

        setTimeout(() => {

            firstCard.classList.remove(
                "flipped"
            );

            secondCard.classList.remove(
                "flipped"
            );

            resetCards();

        }, 800);
    }
}


// =========================
// СБРОС
// =========================

function resetCards() {

    firstCard = null;
    secondCard = null;
    lockBoard = false;
}


// =========================
// ТАЙМЕР
// =========================

function startTimer() {

    timer = setInterval(() => {

        seconds++;

        const minutes =
            Math.floor(seconds / 60);

        const secs =
            seconds % 60;

        timerElement.textContent =
            String(minutes).padStart(2, "0")
            +
            ":"
            +
            String(secs).padStart(2, "0");

    }, 1000);
}


// =========================
// ПОБЕДА
// =========================

async function checkWin() {

    if (matches !== symbols.length) {
        return;
    }

    clearInterval(timer);

    const name =
        localStorage.getItem("playerName");

    finalMoves.textContent = moves;
    finalTime.textContent =
        timerElement.textContent;

    winnerNameElement.textContent = name;

    // Отправляем результат в базу
    await saveResult(
        name,
        moves,
        seconds
    );

    // Показываем победу
    winScreen.style.display = "flex";

    // Обновляем лучший результат
    loadBestScore();
}


// =========================
// СОХРАНЕНИЕ В SUPABASE
// =========================

async function saveResult(name, moves, time) {

    const result = await supabaseClient
        .from("game_results")
        .insert({
            player_name: name,
            moves: moves,
            time_seconds: time
        });

    console.log("SUPABASE RESULT:", result);

    if (result.error) {
        alert("Ошибка: " + result.error.message);
    } else {
        alert("Результат сохранён! 🎉");
    }
}


// =========================
// ЛУЧШИЙ РЕЗУЛЬТАТ
// =========================

async function loadBestScore() {

    const name =
        localStorage.getItem("playerName");

    if (!name) return;

    const { data, error } =
        await supabaseClient
            .from("game_results")
            .select("moves")
            .eq("player_name", name)
            .order("moves", {
                ascending: true
            })
            .limit(1);

    if (error) {

        console.error(error);

        bestElement.textContent = "-";

        return;
    }

    if (data && data.length > 0) {

        bestElement.textContent =
            data[0].moves;

    } else {

        bestElement.textContent = "-";
    }
}


// =========================
// РЕЙТИНГ
// =========================

async function showRating() {

    ratingList.innerHTML = `
        <p style="text-align:center;color:#888;">
            Загружаем рейтинг...
        </p>
    `;

    ratingScreen.style.display = "flex";

    const { data, error } =
        await supabaseClient
            .from("game_results")
            .select("player_name, moves, time_seconds")
            .order("moves", {
                ascending: true
            })
            .order("time_seconds", {
                ascending: true
            });

    if (error) {

        console.error(error);

        ratingList.innerHTML = `
            <p style="text-align:center;color:#888;">
                Не удалось загрузить рейтинг.
            </p>
        `;

        return;
    }

    // Оставляем только лучший результат каждого игрока
    const bestResults = {};

    data.forEach(result => {

        const name = result.player_name;

        if (
            !bestResults[name] ||
            result.moves < bestResults[name].moves ||
            (
                result.moves === bestResults[name].moves &&
                result.time_seconds < bestResults[name].time_seconds
            )
        ) {
            bestResults[name] = result;
        }

    });

    // Превращаем объект в массив
    const players = Object.values(bestResults);

    // Сортируем лучших игроков
    players.sort((a, b) => {

        if (a.moves !== b.moves) {
            return a.moves - b.moves;
        }

        return a.time_seconds - b.time_seconds;

    });

    ratingList.innerHTML = "";

    if (players.length === 0) {

        ratingList.innerHTML = `
            <p style="text-align:center;color:#888;">
                Пока никто не сыграл.
            </p>
        `;

        return;
    }

    players.forEach((result, index) => {

        let place;

        if (index === 0) {
            place = "🥇";
        } else if (index === 1) {
            place = "🥈";
        } else if (index === 2) {
            place = "🥉";
        } else {
            place = index + 1;
        }

        const minutes =
            Math.floor(result.time_seconds / 60);

        const secs =
            result.time_seconds % 60;

        const time =
            String(minutes).padStart(2, "0")
            + ":"
            + String(secs).padStart(2, "0");

        const item =
            document.createElement("div");

        item.classList.add("rating-item");

        item.innerHTML = `
            <div class="rating-place">
                ${place}
            </div>

            <div class="rating-name">
                ${result.player_name}
            </div>

            <div class="rating-moves">
                ${result.moves} ход.
            </div>

            <div class="rating-time">
                ${time}
            </div>
        `;

        ratingList.appendChild(item);

    });
}


// =========================
// КНОПКИ
// =========================

loginButton.addEventListener(
    "click",
    startWithName
);


playerNameInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            startWithName();
        }

    }
);


restartButton.addEventListener(
    "click",
    startGame
);


playAgainButton.addEventListener(
    "click",
    startGame
);


showRatingButton.addEventListener(
    "click",
    showRating
);


winRatingButton.addEventListener(
    "click",
    () => {

        winScreen.style.display = "none";

        showRating();

    }
);


closeRatingButton.addEventListener(
    "click",
    () => {

        ratingScreen.style.display = "none";

    }
);


newPlayerButton.addEventListener(
    "click",
    () => {

        ratingScreen.style.display = "none";

        game.style.display = "none";

        loginScreen.style.display = "flex";

        playerNameInput.value = "";

        playerNameInput.focus();

    }
);


// =========================
// ЗАПУСК
// =========================

// =========================
// ЗАПУСК
// =========================

localStorage.removeItem("playerName");

loginScreen.style.display = "flex";
game.style.display = "none";