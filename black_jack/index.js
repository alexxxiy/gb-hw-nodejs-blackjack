var readline = require('readline');
var fs = require('fs');
var beep = require('beepbeep');


var rl = readline.createInterface({
	input: process.stdin, // ввод из стандартного потока
	output: process.stdout // вывод в стандартный поток
});

module.exports = new BlackJack();

function BlackJack(){
/**
* Игра в Black Jack один на один с компьютером
*/
	var _self = this;

	//массив с целой колодой карт
	this.newCardDeck = require('./cardDeck');

	// игрок
	this.player = {name: 'Player', cards: [], points: 0};
	// дилер
	this.dealer = {name: 'DEALER', cards: [], points: 0};

	this.initGame = function(){
	/**
	* Входная точка в игру
	*/
		rl.question('\nEnter your name:\n', function(answer){
			_self.player.name = (answer == '') ? _self.player.name : answer;
			_self.mainMenu();
		})

	}

	this.mainMenu = function(){
	/**
	* Главное меню
	*/
		rl.question('\n1. New Game \n2. Statistic \n3. Exit Game \n', function(answer){
			switch(answer){
				case "1":
					_self.newGame();
				break
				case "2":
					_self.statistics();
				break
				case "3":
					rl.close();
				break
				default: _self.mainMenu();

			}
		})
	}

	this.statistics = function(){
	/**
	* Показать статистику по текущему игроку
	*/
		var file = './log/' + _self.player.name + '_log.txt';

		fs.exists(file, (exists) => {
			if(exists){
				// Преобразовываем данные из log-файла в двумерный массив
				var strArr = fs.readFileSync(file, 'utf8').split('\n');
				var data =[];
				var j = 0;
				for (var i = 1; i < strArr.length; i++) {
					if(strArr[i] !== '') data[j] = strArr[i].split(';');
					j++;
				}

				// Считаем статистику
				var s = '\nStatistics:\n'

				//Количество партий
				s += 'The number of games played: ' + (data.length) + '\n';

				//В разрезе рузультата
				var result = {win: 0, lose: 0, deadHeat: 0};

				//Максимальное число выигрышей подряд
				var maxWinInRow  = 0;
				var maxWinInRowTmp  = 0;
				// ... проигрышей...
				var maxLoseInRow = 0;
				var maxLoseInRowTmp = 0;

				for (var i = 0; i < data.length; i++) {
					var r = data[i][1];

					result[r]++;

					var preR = (i === 0) ? data[i][1] : data[i-1][1];

					if (r === 'win'){
						if(preR === r){
							maxWinInRowTmp++;
						} else{
							maxWinInRow = (maxWinInRow < maxWinInRowTmp) ? maxWinInRowTmp : maxWinInRow;
							maxWinInRowTmp = 1
						}
					} else if(r === 'lose'){
						if(preR === r){
							maxLoseInRowTmp++;
						} else{
							maxLoseInRow = (maxLoseInRow < maxLoseInRowTmp) ? maxLoseInRowTmp : maxLoseInRow;
							maxLoseInRowTmp = 1
						}
					} 
				}

				maxWinInRow = maxWinInRow || maxWinInRowTmp;
				maxLoseInRow = maxLoseInRow || maxLoseInRowTmp;


				s += 'Win: ' + result.win + '\n';
				s += 'Lose: ' + result.lose + '\n';
				s += 'Dead Heat: ' + result.deadHeat + '\n';

				s += 'Max win in row: ' + maxWinInRow + '\n';
				s += 'Max lose in row: ' + maxLoseInRow + '\n';
				
				// Соотношение выигрышей к проигрышам
				if(result.lose > 0){
					s += 'Win/Lose: ' + Math.round(result.win/result.lose * 100) / 100 + '\n';
				}

				console.log(s);
			} else{
				console.log('No statistics for current player')
			}

			_self.mainMenu();
		})
	};

	this.newGame = function(){
	/**
	* Новая игра
	*/
		// обновляем колоду если это не первая игра
		_self.cardDeck = _self.newCardDeck.slice();

		// игрок
		_self.player.cards = [];
		_self.player.points = 0;
		// дилер
		_self.dealer.cards = [];
		_self.dealer.points = 0;

		//сдаем одну карту дилеру
		_self.getCard(_self.dealer);

		//сдаем две карты игроку
		_self.getCard(_self.player);
		_self.getCard(_self.player);

		_self.showCards(_self.dealer);
		_self.showCards(_self.player);

		//Если в самом начале игры набрали БлэкДжек то мы победили
		if (_self.player.points === 21) {
			_self.win('Black Jack!!!');
		} else{
			_self.game();
		}	
	}

	this.endGame = function(){
		/**
		* Конец игры
		*/
		rl.question('New Game?(y/n)', function(answer){
			if(answer === 'n') {
				_self.mainMenu();
			} else if(answer === 'y') {
				_self.newGame();
			} else {
				_self.endGame();
			}
		})
	}


	this.getCard = function(player){
	/**
	* Вытащить карту из колоды для игрока player
	*/
		//случайно выбираем карту
		var n = Math.floor(Math.random() * (_self.cardDeck.length));

		//сохраняем карту у игрока
		player.cards.push(_self.cardDeck[n]);
		//увеличиваем его очки
		player.points = _self.countPoints(player);

		//удаляем карту из колоды
		_self.cardDeck.splice(n, 1);
	}

	this.countPoints = function(player){
	/**
	* Подсчитать очки у игрока
	*/
		var points = 0;
		var notAce = 0;

		for (var i = 0; i < player.cards.length; i++) {
			if(player.cards[i].nominal !== 'A'){
				points += parseInt(player.cards[i].points);
			}
			notAce++; // подсчитываем количество карт, не тузов
		}

		//Туз считается за 11 или за 1 в зависимости от ситуации
		for (var i = 0; i < player.cards.length; i++) {
			if(player.cards[i].nominal === 'A'){
				points += (points <= 10 && (player.cards.length - notAce) <= 1) ? 11 : 1;
			}
		}

		return points;
	}

	this.showCards = function(player){
	/**
	* Вывести руку игрока в консоль
	*/	
		var str = '';

		if(player.name === 'DEALER'){
			str = '\x1B[30;41m DEALER:\x1b[0m ';
		} else{
			str = '\x1B[37;43m ' + player.name + ':\x1b[0m ';
		}

		for (var i = 0; i < player.cards.length; i++) {
			var color = '';

			switch(player.cards[i].suit){
				case 'spades':
					color += '\x1B[30;47m'
				break
				case 'clubs':
					color += '\x1B[30;47m'
				break
				case 'hearts':
					color += '\x1B[31;47m'
				break
				case 'diamonds':
					color += '\x1B[31;47m'
				break
			}
			str += color + player.cards[i].nominal + player.cards[i].char + '\x1b[0m ';
		}

		str += '\x1B[35m points: ' + player.points + '\x1b[0m ';

		console.log(str);
	}

	this.dealerMove = function(){
	/**
	* Дилер обязан продолжать набирать карты, если сумма его карт меньше 17 очков, и дилер должен остановиться, если у него 17 или более очков.
	*/
		beep();

		_self.getCard(_self.dealer);
		_self.showCards(_self.dealer);

		if (_self.dealer.cards.length === 2 && _self.dealer.points === 21){
			_self.lose('The dealer have a BlackJack!');
		} else if(_self.dealer.points > 21){
			_self.win('The dealer going bust!');
		} else if(_self.dealer.points >= 17){
			if(_self.dealer.points > _self.player.points){
				_self.lose('The dealer have more points!');
			} else if(_self.dealer.points < _self.player.points){
				_self.win('You have more points!');
			} else if(_self.dealer.points === _self.player.points){
				_self.deadHeat();
			}
		} else setTimeout(_self.dealerMove, 500);

		return;
	}

	this.game = function(){
	/**
	* Игра с игроком
	*/
		beep();
		rl.question('One more card?(y/n)', function(answer) {
	 		if (answer === 'y'){
 				setTimeout(_self.playerMove, 500);
 			} else if(answer === 'n'){
 				_self.dealerMove();
 			} else {
 				_self.game();
 			}
		});
	}

	this.playerMove = function(){
	/**
	* Ход игрока
	*/
		_self.getCard(_self.player);
 		_self.showCards(_self.player);

		if(_self.player.points > 21){
 			_self.lose('You have going bust!');
 		} else if(_self.player.points === 21){
 			_self.dealerMove();
 		} else {
 			_self.game();
 		}
	}

	this.win = function(message){
	/**
	* Игрок выиграл
	*/
		setTimeout(function(){
			beep([0, 300, 100, 100, 100]);
			console.log(message);
			console.log('\x1B[37;43m ' + _self.player.name + ' WIN!!!:\x1b[0m ');
			_self.endGame();
		}, 1000)

		_self.log('win');

	}

	this.lose = function(message){
	/**
	* Игрок проиграл
	*/	
		setTimeout(function(){
			beep([0, 100]);
			console.log(message);
			console.log('\x1B[30;41m ' + _self.player.name + ' LOSE\x1b[0m ');
			_self.endGame();
		}, 1000)

		_self.log('lose');
		
	}

	this.deadHeat = function(){
	/**
	* Ничья
	*/
		setTimeout(function(){
			beep([0, 400, 400]);
			console.log('\x1B[30;47m Dead Heat\x1b[0m');
			_self.endGame();
		}, 1000)

		_self.log('deadHeat');
	}

	this.log = function(result){
	/**
	* Логирование результатов
	*/	
		var playerCards = '';
		for (var i = 0; i < _self.player.cards.length; i++) {
			playerCards += _self.player.cards[i].nominal + _self.player.cards[i].char + ' ';
		}

		var dealerCards = '';
		for (var i = 0; i < _self.dealer.cards.length; i++) {
			dealerCards += _self.dealer.cards[i].nominal + _self.dealer.cards[i].char + ' ';
		}

		var date = new Date();

		var log = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
		        + ';' + result 
		        + ';' + playerCards.substr(0, (playerCards.length - 1))
		        + ';' + dealerCards.substr(0, (dealerCards.length - 1))
		        + ';\n'

		var file = './log/' + _self.player.name + '_log.txt';

		if(!fs.existsSync('./log')){
			fs.mkdirSync('./log');
		}
		
		fs.exists(file, (exists) =>{
			if(!exists){
				fs.appendFileSync(file, 'date_time;result;player;dealer;\n', 'utf8');
			}

			fs.appendFile(file, log, 'utf8', (err) => {if (err) throw err;})

		})	
	}
}