const game = new Chess();
const board = document.getElementById('board');
var pgn = [];
var moveSans = [];
var moveCount = 0;

document.body.onload = function() {
    if (localStorage.getItem('pgn') !== null) {
        pgn = localStorage.getItem('pgn');
        moveSans = JSON.parse(localStorage.getItem('moveSans'));
        game.load_pgn(pgn);
        board.setPosition(game.fen());
        localStorage.removeItem('pgn');
        moveCount = game.history().length;
    }
}

board.addEventListener('drag-start', (e) => {
    const {piece} = e.detail;
    if (game.game_over()) return e.preventDefault();
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return e.preventDefault();
    }
});

board.addEventListener('drop', (e) => {
    const {source, target, setAction} = e.detail;
    const move = game.move({from: source, to: target, promotion: "q"});
    if (move === null) return setAction('snapback');
    pgn = game.pgn({ maxWidth: 5, newline: '\n' });
    moveSans.push(move.san);
    moveCount += 1;
    if (game.game_over()) {
        alert('Game over');
        document.getElementById('downloadBtn').style.display = 'inline-block';
    }
});

board.addEventListener('snap-end', () => {
    board.setPosition(game.fen());
});

document.getElementById('downloadBtn').onclick = function() {
    if (pgn.length === 0) {
        return
    }
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('reviewBtn').onclick = async function() {
    if (moveCount <= 5){
        alert('Please play at least 5 moves to review the game.');
        return;
    }
    document.getElementById('downloadBtn').style.display = 'inline-block';
    if (localStorage.getItem('access_token') === null) {
        alert('Please log in to review the game.');
        window.location.href = 'login.html';
    }
    try {
        const protectedResponse = await fetch('http://127.0.0.1:8000/protected', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        });
        if (!protectedResponse.ok) {
            throw new Error('Unauthorized');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        localStorage.setItem('pgn', pgn);
        localStorage.setItem('moveSans', JSON.stringify(moveSans));
        window.location.href = 'index.html';
        return;
    }

    // Show modal
    const reviewModal = document.getElementById('reviewModal');
    reviewModal.classList.add('show');

    // Show progress bar
    const progressBarContainer = document.getElementById('progressBar');
    progressBarContainer.style.display = 'block';
    const progressElem = progressBarContainer.querySelector('progress');
    progressElem.value = 0;
    progressElem.max = 100;

    // Simulate progress
    let percent = 0;
    const interval = setInterval(() => {
        percent += Math.random() * 10;
        if (percent > 90) percent = 90;
        progressElem.value = percent;
    }, 200);

    var data;
    var worked = false;

    try {
        const reviewResponse = await fetch('http://127.0.0.1:8000/review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            },
            body: JSON.stringify({ pgn })
        });
        data = await reviewResponse.json();
        if (reviewResponse.ok){
            document.getElementById('bcount').textContent = Object.keys(data.analysis.blunders).length;
            document.getElementById('mcount').textContent = Object.keys(data.analysis.mistakes).length;
            document.getElementById('gcount').textContent = Object.keys(data.analysis.great_moves).length;
            worked = true;

        }
       
    } catch (error) {
        console.error('Error:', error);
    } finally {
        clearInterval(interval);
        progressElem.value = 100;
        setTimeout(() => {
            progressBarContainer.style.display = 'none';
        }, 500);
        const movesList = document.getElementById('movesList');
        movesList.innerHTML = '';

        for (let i = 0; i < moveSans.length; i += 2) {
            const li = document.createElement('li');
            li.classList.add('move-list-item');

            const moveNumber = document.createElement('span');
            moveNumber.textContent = `${(i / 2) + 1}. `;
            moveNumber.classList.add('move-number');
            li.appendChild(moveNumber);

            
            const whiteMove = document.createElement('span');
            whiteMove.textContent = moveSans[i];
            whiteMove.classList.add('white-move');
            if (worked) {
                if (data.analysis.blunders[i]) {
                    whiteMove.classList.add('blunder');
                } else if (data.analysis.mistakes[i]) {
                    whiteMove.classList.add('mistake');
                } else if (data.analysis.great_moves[i]) {
                    whiteMove.classList.add('great-move');
                }
            }

            li.appendChild(whiteMove);

            if (moveSans[i + 1]) {
                const blackMove = document.createElement('span');
                blackMove.textContent = ` ${moveSans[i + 1]}`;
                blackMove.classList.add('black-move');
                if (worked) {
                    if (data.analysis.blunders[i + 1]) {
                        blackMove.classList.add('blunder');
                    } else if (data.analysis.mistakes[i + 1]) {
                        blackMove.classList.add('mistake');
                    } else if (data.analysis.great_moves[i + 1]) {
                        blackMove.classList.add('great-move');
                    }
                }
                li.appendChild(blackMove);
            }

            movesList.appendChild(li);
        }
    }
}

// Modal close logic

document.getElementById('closeModal').onclick = function() {
    document.getElementById('reviewModal').classList.remove('show');
}

// Optional: close modal when clicking outside modal-content
document.getElementById('reviewModal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('show');
    }
});

document.getElementById('undoBtn').onclick = function() {
    if (moveCount === 0) return;
    game.undo();
    moveCount -= 1;
    moveSans.pop();
    board.setPosition(game.fen());
}

document.getElementById('newGameBtn').onclick = function() {
    game.reset();
    pgn = [];
    moveCount = 0;
    moveSans = [];
    board.start();
}