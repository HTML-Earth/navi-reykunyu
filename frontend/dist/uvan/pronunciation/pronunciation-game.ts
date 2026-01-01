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
var convert = new Convert();

var replacementSounds: Record<string, Array<string>> = {
	"1": ["3", "a", "o", "u", "ù"], // aw
	"2": ["4", "a", "e", "i", "ì"], // ay
	"3": ["1", "e", "ä", "u", "ù"], // ew
	"4": ["3", "e", "ä", "i", "ì"], // ey
	"a": ["ä", "e", "o", "1", "2"],
	"ä": ["a", "e", "ì"],
	"e": ["ä", "ì", "i", "3", "4"],
	"ì": ["e", "i"],
	"i": ["ì", "e", "2"],
	"u": ["a", "ù", "o", "1", "3"],
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

//TODO:
// save mistakes
// start game + options
// - distinguish ù
// - vowels/consonants only
// - include reef consonants
// more speakers
// text to audio

const maxAnswers = 4;
var correctCount = 0;
var totalCount = 0;
var currentQuestion: any;
var audioList: Array<string> = [];

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

fetchAndSetUp();

async function fetchAndSetUp(): Promise<void> {
    try {
        const response = await fetch('audio/list.txt');
        if (!response.ok) {
            throw new Error('Failed to fetch list of audio files');
        }
        const fileData = await response.text();
		const lines = fileData.split(/\r?\n/);
		for (var line of lines) {
			audioList.push(line);
		}
		setUpQuestionAudioToText();
    } catch (error) {
        console.error('Error fetching list of audio files:', error);
    }
}

function setUpQuestionAudioToText(): void {
	const $wordAudio = $('#word-audio');
	$wordAudio.empty();

	var randomSoundIndex = Math.floor((Math.random() * audioList.length));
	var filePath = audioList[randomSoundIndex];
	var sound = filePath.substring(filePath.lastIndexOf('/')+1, filePath.lastIndexOf("."));

	var audioPlayer = document.createElement('audio');
	audioPlayer.controls = true;
	audioPlayer.src = 'audio/' + filePath;

	$wordAudio.append($('<div/>').addClass('title').text("Select the text that matches the audio"));
	$wordAudio.append(audioPlayer);

	const $answersText = $('#answers-text');
	$answersText.empty();

	var base = convert.compress(sound);
	var answers = generateWrongAnswers(base, maxAnswers - 1);
	var randomCorrectIndex = Math.floor((Math.random() * answers.length));
	answers.splice(randomCorrectIndex, 0, base);

	//const syllables = this.currentQuestion.pronunciation[0]['syllables'].split('-');
	for (let i = 0; i < answers.length; i++) {
		if (i > 0) {
			$answersText.append(createSeparator());
		}
		const answer = convert.decompress(answers[i]);
		$answersText.append(createAnswerTextBlock(answer, i, randomCorrectIndex));
	}

	audioPlayer.play();
}

function generateWrongAnswers(correctAnswer: string, maxAnswers: number): Array<string> {
	const maxAttempts = 100;
	var answers: Array<string> = [];
	for (let i = 0; i < maxAttempts; i++) {
		var index = Math.floor((Math.random() * correctAnswer.length));
		var pre = correctAnswer.substring(0, index);
		var post = correctAnswer.substring(index + 1);

		var soundToReplace = correctAnswer.charAt(index);

		var possibleReplacements: Array<string> = replacementSounds[soundToReplace];
		var randomReplacementIndex = Math.floor((Math.random() * possibleReplacements.length));
		var replacedSound = possibleReplacements[randomReplacementIndex];

		var modified = pre + replacedSound + post;

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

function createAnswerTextBlock(text: string, i: number, correct: number): JQuery<HTMLElement> {
	const $syllable = $('<div/>').addClass('answer');
	if (i === correct) {
		$syllable.addClass('correct');
	} else {
		$syllable.addClass('incorrect');
	}
	// $('<div/>')
	// 	.addClass('index')
	// 	.text('' + i)
	// 	.appendTo($syllable);
	$('<div/>')
		.addClass('navi')
		.text(text)
		.appendTo($syllable);

	$syllable.on('click', function () {
		const $syllables = $('#answers');
		$syllables.children('.answer').children('.index').html('&nbsp;');
		const $correctSyllable = $($syllables.children('.answer')[correct - 1]);
		$correctSyllable.children('.index').text('✓');
		$syllable.addClass('chosen');
		let timeout = 300;
		if (i === correct) {
			correctCount++;
		} else {
			$syllable.children('.index').text('✗');
			$correctSyllable.addClass('correction');
			timeout = 2000;

			// add to mistakes list
			// let $mistake = $('<span/>').addClass('mistake');
			// const syllables = currentQuestion['pronunciation'][0]['syllables'].split('-');
			// for (let j = 0; j < syllables.length; j++) {
			// 	if (j > 0) {
			// 		$mistake.append('-');
			// 	}
			// 	if ((j + 1) === currentQuestion['pronunciation'][0]['stressed']) {
			// 		$mistake.append($('<span/>').addClass('mistake-correct').html(syllables[j]));
			// 	} else if ((j + 1) === i) {
			// 		$mistake.append($('<span/>').addClass('mistake-wrong').html(syllables[j]));
			// 	} else {
			// 		$mistake.append(syllables[j]);
			// 	}
			// }
			// let $mistakesList = $('#mistakes-list');
			// if ($mistakesList.html() === '(none yet!)') {
			// 	$mistakesList.empty();
			// }
			// $mistakesList.append($mistake);
		}
		totalCount++;
		updateScore();

		setTimeout(function () {
			fetchAndSetUp();
		}, timeout);
	});
	return $syllable;
}

function createSeparator(): JQuery<HTMLElement> {
	return $('<div/>').addClass('separator');
}

function updateScore(): void {
	const scoreString = correctCount + '/' + totalCount;
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