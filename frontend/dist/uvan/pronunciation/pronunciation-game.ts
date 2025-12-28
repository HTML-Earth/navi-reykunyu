// this could have been done by importing convert.ts,
// but compiling it separately without ruining the folder structure is txìmmì a txim
class Convert {
	compress(word: string): string {
		let result = word.replace(/ts/g, 'c')
						.replace(/ng/g, 'G')
						.replace(/tx/g, 'T')
						.replace(/px/g, 'P')
						.replace(/kx/g, 'K')
						.replace(/ll/g, 'L')
						.replace(/rr/g, 'R')
						.replace(/aw/g, '1')
						.replace(/ay/g, '2')
						.replace(/ew/g, '3')
						.replace(/ey/g, '4')
						.replace(/·/g, '');
		return result;
	}
	decompress(word: string): string {
		let result = word.replace(/1/g, 'aw')
						.replace(/2/g, 'ay')
						.replace(/3/g, 'ew')
						.replace(/4/g, 'ey')
						.replace(/L/g, 'll')
						.replace(/R/g, 'rr')
						.replace(/T/g, 'tx')
						.replace(/P/g, 'px')
						.replace(/K/g, 'kx')
						.replace(/c/g, 'ts')
						.replace(/ng/g, 'n·g')
						.replace(/G/g, 'ng');
		return result;
	}
}

class PronunciationGame {
	convert = new Convert();
	correctCount = 0;
	totalCount = 0;
	currentQuestion: any;

	replacementSounds: Record<string, Array<string>> = {
		"1": ["a", "o", "u", "ù"], // aw
		"2": ["a", "e", "i", "ì"], // ay
		"3": ["e", "ä", "u", "ù"], // ew
		"4": ["e", "ä", "i", "ì"], // ey
		"a": ["ä", "e", "o"],
		"ä": ["a", "e", "ì"],
		"e": ["ä", "ì", "i"],
		"ì": ["e", "i"],
		"i": ["ì", "e"],
		"u": ["a", "ù", "o"],
		"ù": ["u", "o"],
		"o": ["ä", "ì"],
		"'": ["", "k", "p", "t"],
		"f": ["v", "s"],
		"h": ["", "'"],
		"k": ["K", "'"],
		"K": ["k"], // kx
		"l": ["r"],
		"L": ["R"], // ll
		"m": ["n", "G"],
		"n": ["G", "m"],
		"G": ["n", "m"], // ng
		"p": ["P", "'"],
		"P": ["p"], // px
		"r": ["l"],
		"R": ["L"], // rr
		"s": ["c", "z"],
		"c": ["s", "z"], // ts
		"t": ["T", "'"],
		"T": ["t"], // tx
		"v": ["f", "w"],
		"w": ["v"],
		"y": ["i"],
		"z": ["s", "c"],
	};

	constructor() {
		this.setUpQuestionAudioToText();

		$('html').on('keydown', function (e: JQuery.KeyDownEvent) {
			const number = parseFloat(e.key);
			if (isNaN(number)) {
				return;
			}
			const $syllables = $('#syllables').children('.syllable');
			if (number - 1 < 0 || number - 1 > $syllables.length) {
				return;
			}
			$($syllables[number - 1]).trigger('click');
		});

		$('.score').on('click', function () {
			const popout = $('.score-popout');
			if (popout.is(':visible')) {
				$('#overlay').removeClass('visible');
				$('.score-popout').slideUp();
			} else {
				$('#overlay').addClass('visible');
				$('.score-popout').slideDown();
			}
		});
	}

	fetchAndSetUp(): void {
		const self = this;
		$.getJSON('/api/random', { 'holpxay': 1 }).done(function (data) {
			if (!data[0].hasOwnProperty('pronunciation') ||
				data[0]['pronunciation'].length !== 1 ||
				!(data[0]['pronunciation'][0]['syllables'].includes('-')) ||
				data[0]['pronunciation'][0]['stressed'] === null ||
				data[0]['type'] === 'n:si') {
				self.fetchAndSetUp();
				return;
			}
			self.currentQuestion = data[0];
			self.setUpQuestionAudioToText();
		});
	}

	setUpQuestionAudioToText(): void {
		const $wordAudio = $('#word-audio');
		$wordAudio.empty();

		var audioPlayer = document.createElement('audio');
		audioPlayer.controls = true;
		audioPlayer.src = 'audio/\'rrta/nan.mp3';

		$wordAudio.append($('<div/>').addClass('title').text("Select the text that matches the audio"));
		$wordAudio.append(audioPlayer);

		const $answersText = $('#answers-text');
		$answersText.empty();

		var answers = this.generateWrongAnswers("nan");
		//const syllables = this.currentQuestion.pronunciation[0]['syllables'].split('-');
		for (let i = 0; i < answers.length; i++) {
			if (i > 0) {
				$answersText.append(this.createSeparator());
			}
			const answer = this.convert.decompress(answers[i]);
			$answersText.append(this.createAnswerTextBlock(answer, i, 0));
		}

		audioPlayer.play();
	}

	generateWrongAnswers(correctAnswer: string): Array<string> {
		const maxAnswers = 4;
		const maxAttempts = 100;
		var answers: Array<string> = [];
		var base = this.convert.compress(correctAnswer);
		answers.push(base);
		for (let i = 0; i < maxAttempts; i++) {
			var index = Math.floor((Math.random() * base.length));
			var pre = base.substring(0, index);
			var post = base.substring(index + 1);

			var replacementSounds = this.replacementSounds[base.charAt(index)];
			var randomSoundIndex = Math.floor((Math.random() * replacementSounds.length));
			var replacedChar = replacementSounds[randomSoundIndex];
			var modified = pre + replacedChar + post;

			if (answers.includes(modified)) {
				continue;
			}
			answers.push(modified);
			if (answers.length >= maxAnswers) {
				break;
			}
		}
		return answers;
	}

	createAnswerTextBlock(text: string, i: number, correct: number): JQuery<HTMLElement> {
		const $syllable = $('<div/>').addClass('answer');
		if (i === correct) {
			$syllable.addClass('correct');
		} else {
			$syllable.addClass('incorrect');
		}
		$('<div/>')
			.addClass('navi')
			.text(text)
			.appendTo($syllable);
		$('<div/>')
			.addClass('index')
			.text('' + i)
			.appendTo($syllable);

		const self = this;

		$syllable.on('click', function () {
			const $syllables = $('#answers');
			$syllables.children('.answer').children('.index').html('&nbsp;');
			const $correctSyllable = $($syllables.children('.answer')[correct - 1]);
			$correctSyllable.children('.index').text('✓');
			$syllable.addClass('chosen');
			let timeout = 300;
			if (i === correct) {
				self.correctCount++;
			} else {
				$syllable.children('.index').text('✗');
				$correctSyllable.addClass('correction');
				timeout = 2000;

				// add to mistakes list
				let $mistake = $('<span/>').addClass('mistake');
				const syllables = self.currentQuestion['pronunciation'][0]['syllables'].split('-');
				for (let j = 0; j < syllables.length; j++) {
					if (j > 0) {
						$mistake.append('-');
					}
					if ((j + 1) === self.currentQuestion['pronunciation'][0]['stressed']) {
						$mistake.append($('<span/>').addClass('mistake-correct').html(syllables[j]));
					} else if ((j + 1) === i) {
						$mistake.append($('<span/>').addClass('mistake-wrong').html(syllables[j]));
					} else {
						$mistake.append(syllables[j]);
					}
				}
				let $mistakesList = $('#mistakes-list');
				if ($mistakesList.html() === '(none yet!)') {
					$mistakesList.empty();
				}
				$mistakesList.append($mistake);
			}
			self.totalCount++;
			self.updateScore();

			setTimeout(function () {
				self.fetchAndSetUp();
			}, timeout);
		});
		return $syllable;
	}

	createSeparator(): JQuery<HTMLElement> {
		return $('<div/>').addClass('separator');
	}

	toReadableType(type: string): string {
		const mapping: { [name: string]: string; } = {
			"n": "n.",
			"n:unc": "n.",
			"n:si": "v.",
			"n:pr": "prop. n.",
			"pn": "pn.",
			"adj": "adj.",
			"num": "num.",
			"adv": "adv.",
			"adp": "adp.",
			"adp:len": "adp+",
			"intj": "intj.",
			"part": "part.",
			"conj": "conj.",
			"ctr": "sbd.",
			"v:?": "v.",
			"v:in": "vin.",
			"v:tr": "vtr.",
			"v:m": "vm.",
			"v:si": "v.",
			"v:cp": "vcp.",
			"phr": "phr.",
			"inter": "inter.",
			"aff:pre": "pref.",
			"aff:pre:len": "pref.",
			"aff:in": "inf.",
			"aff:suf": "suf.",
			"nv:si": "vin."
		};
		return mapping[type];
	}

	updateScore(): void {
		const scoreString = this.correctCount + '/' + this.totalCount;
		const $scoreField = $('#score-field');
		$scoreField
			.addClass('just-changed')
			.text(scoreString);
		setTimeout(function () {
			$scoreField.removeClass('just-changed');
			$scoreField.addClass('in-transition');
		});
		setTimeout(function () {
			$scoreField.removeClass('in-transition');
		}, 250);
	}
}

new PronunciationGame();