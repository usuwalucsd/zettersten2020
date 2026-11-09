 
/**
 * Author: Urvi Suwal
 * Replication of Sampling to Learn Words: Experiment S1 (Zettersten & Saffran, 2020)
 * Modifications: added additional sampling blocks to examine whether or not sampling behavior 
 * changes across time 
 */

var jsPsych = initJsPsych({

  show_progress_bar: true, 
  on_finish: function () {
    jsPsych.data.displayData();
  },
  // for datapipe   
  extensions: [
    {
      type: jsPsychExtensionPipe,
      params: {
        experiment_id: "hxixbjitXwxr",
        filename: function () {
          return subject_id + ".csv";
        }
      }
    }
  ]
});

var subject_id = jsPsych.randomization.randomID(10);

// in the original script, there were three conditions 
// - high: fully ambiguous, 
// - medium: partially ambiguous
// - low: not ambiguous (this was not reported in the s1 findings)
// const condition = jsPsych.randomization.sampleWithoutReplacement(["high", "medium", "low"], 1); 
const condition = jsPsych.randomization.sampleWithoutReplacement(['high', 'medium'], 1)[0];


// record participant id and condition in the main data
jsPsych.data.addProperties({
	subject: subject_id,
	condition: condition,
});

// novel words 
var wordItems = ["beppo","finna","guffi", "kita", "noopy", "manu", "sibu", "tesser"]; 
wordItems = jsPsych.randomization.shuffle(wordItems); // randomize words 

// novel object images
var imageItems = [1,2,3,4,5,6,7,8];
imageItems = jsPsych.randomization.shuffle(imageItems); // randomize images

// randomly pair image and words to the stims dictionary
// stims[i] = {image, word, audio}
var stims = wordItems.map((word, i) => ({
  image: `stimuli/${imageItems[i]}.png`,
  word: word,
  audio: `stimuli/${word}.m4a`
}));

var timeline = []; 
const instruction_format = (text) => `<div style="max-width: 50em; margin: 0 auto; text-align: left">${text}</div>`;

// --------------------------------------  PRELOAD   -------------------------------------------------------
// load all images and audio before the experiment starts (as in the original script),
// so the words play on time and the aliens appear without delay
var preload = {
  type: jsPsychPreload,
  images: stims.map((stim) => stim.image),
  audio: stims.map((stim) => stim.audio).concat(['stimuli/apple.m4a', 'stimuli/ball.m4a']), // novel words + audio check words
};


// --------------------------------------  FULLSCREEN INSTRUCTIONS AUDITORY ATTENTION CHECK   -------------------------------------------------------


var instructionsAttentionCheck = []; 

var fullscreen = {
  type: jsPsychFullscreen,
  message: `<p>The experiment will launch in fullscreen mode when you click the button below.</p>`, 
  button_label: `Launch Experiment`, 
  fullscreen_mode: true
}; instructionsAttentionCheck.push(fullscreen);


var instructions = { // general instructions
  type: jsPsychInstructions,
  pages: [
    instruction_format('Welcome to this experiment. In this experiment you will learn names for aliens. There will be few different learning tasks as you go.<br><br>You will need to hear audio during the experiment, so make sure you are using an up-to-date browser (Firefox, Chrome, or Safari should all be good options). First, we will check that your audio is working properly. We will play you simple words and ask you to type in what you hear. Pay close attention - we will only accept HITs in which people pass this initial audio test. Make sure your audio is turned on, then click NEXT to start the audio test!'),
  ],
  show_clickable_nav: true
}; instructionsAttentionCheck.push(instructions); 

// auditory attention check
// part of the exclusion criteria if participants do not identify the correct word 
// that they hear in the audio 
var audio_check = {
  timeline: [
    {
      type: jsPsychSurveyHtmlForm,
      preamble: function () {
        return `<div style="text-align: left;">
            <p>Click on the Play button to hear an audio recording. Then enter the word you heard. Click the<br>button to hear the sound again. Click on the Submit Answers button when you are finished.<br></p>
            <button type="button" class="jspsych-btn" onclick="new Audio('${jsPsych.evaluateTimelineVariable('audio')}').play()">Play</button></div>`;
      },
      html: '<p style="text-align: left;"><textarea id="test-resp-box" name="response" style="resize: both;"></textarea></p>',
      autofocus: 'test-resp-box',
      button_label: "Submit Answers",
      post_trial_gap: 500, 
      data: {
        audio: jsPsych.timelineVariable('audio')
      },
      on_finish: function (data) {
        data.response = data.response.response;
      }
    }],
  timeline_variables: [
    { audio: 'stimuli/apple.m4a' },
    { audio: 'stimuli/ball.m4a' }
  ], 
  randomize_order: true, 
}; instructionsAttentionCheck.push(audio_check)


instructions = { // general instructions 
  type: jsPsychInstructions,
  pages: [
    instruction_format(`Great! Now, let's begin with the experiment. In the first task, you will learn the names for 8 different alien creatures. On each trial, you will see two aliens and hear and read two names. At first, you won't know which name goes with which alien because the names appear <b>in random order</b>. Try to figure out over time which name goes with which alien. Please do not write any information down - just do your best to remember and learn the names as you go. Remember that you'll hear the name for each of the two aliens and read them on the screen, but the order of the names will be completely random (so, for example, the first name that appears does not necessarily go with the left alien). Make sure your audio is still on, then click NEXT to start learning!`)
  ],
  show_clickable_nav: true
}; instructionsAttentionCheck.push (instructions); 

// ------------------------------------------------  TRAINING PHASE  -----------------------------------------------------------------

var trainingPhase = []; 

// Note: Hard coded stimulis combination are from the original experiment script that was available in OSF
// each block has 12 cross-situational trials, each showing 2 object (pairs of indices into stims);
// every object appears 3 times per block, and the same 12 pairs are reshuffled for each of the 2 blocks
// - object 0-3: the (fully or partially) ambiguous set, depending on condition
// - object 4-7: the disambiguated set; each appears with three different partners

//define specific stimuli combinations, depending on condition
const specifiedstim = {
  // fully ambiguous condition --> high 
  'high': [[0,1],[0,1],[0,1],[2,3],[2,3],[2,3],[4,5],[4,6],[4,7],[5,6],[5,7],[6,7]],
  
  // partially ambiguous condition --> medium
  'medium': [[0,1],[0,1],[0,2],[2,3],[2,3],[1,3],[4,5],[4,6],[4,7],[5,6],[5,7],[6,7]],
  
  // not ambiguous condition --> low (this condition was not included in S1 but is included in the original Experiment S1 script)
  // 'low': [[0,1],[0,2],[0,3],[1,2],[1,4],[2,5],[3,6],[3,7],[4,5],[4,6],[5,7],[6,7]],

}

// stimuli combination depending on the condiiton; randomized 
var stimulus_set_condition = jsPsych.randomization.repeat(specifiedstim[condition], 1);

const numTrainingBlocks = 2; 
const numTrainingTrialsPerBlock = specifiedstim[condition].length; // 12 from the specified stim list 

for (let block = 0; block < numTrainingBlocks; block++){
  
  // randomly ordered pairs of stimuli that appear on each training phase trial 
  var currentTrainingBlockTrials = jsPsych.randomization.shuffle(specifiedstim[condition]);

  // reminder/repeated instruction page, participants are given the same instructions about the learning the object-word association 
  // comes after completing a block of training phase trials 
  if (block > 0) trainingPhase.push(
	  {
      type: jsPsychInstructions,
      pages: [instruction_format("Here are some more learning trials where you see two aliens and hear two names. The names will appear in random order, so you will have to figure out which name goes with each alien over time. Pay close attention and try to learn the names for the aliens!")],
      show_clickable_nav: true
    }
  )

  for (let trial = 0; trial < numTrainingTrialsPerBlock; trial++){

    // stimuli pairs that will appear in the trial
    var currentStimuliPair = currentTrainingBlockTrials[trial]; 
    const [stimuli1, stimuli2] = [stims[currentStimuliPair[0]], stims[currentStimuliPair[1]]]; 

    // which side each image appears on in the trial
    const [location1, location2] = jsPsych.randomization.shuffle(["left", "right"]);
    
    // order in which the word+audio is presented in the trial
    const [wordOrder1, wordOrder2] = jsPsych.randomization.shuffle([0, 1]);


    var trainingTrial = {
      type: jsPsychLearning,
      stimuli1: stimuli1,
      stimuli2: stimuli2,
      location1: location1,
      location2: location2,
      wordOrder1: wordOrder1,
      wordOrder2: wordOrder2
    }

    trainingPhase.push(trainingTrial);
    
  }
}

// ------------------------------------------------  SAMPLING PHASE  -----------------------------------------------------------------

var samplingPhase = [];

var samplingInstructions = {
  type: jsPsychInstructions,
  pages: [instruction_format('Next, you will get a chance to choose which alien to learn about next. On a trial, you will see all 8 aliens on the screen. Then, you will get to choose which of the 8 aliens you would like to appear in the next learning trial. After you choose an alien, another alien will be chosen at random by the computer. Then, you will see a new learning trial - just like the ones you just saw - with two aliens: the alien you picked and the alien chosen at random. Remember that we will test how well you learned the words later, so try to make choices that will help you learn the names! Click NEXT to get started.')],
  show_clickable_nav: true
}; samplingPhase.push(samplingInstructions);

const numSamplingBlocks = 1; 
const numSamplingTrialsPerBlock = 4; 
const sampling_stims = jsPsych.randomization.shuffle(stims); 
const locations = jsPsych.randomization.repeat([["left", "right"], ["right", "left"]], numSamplingTrialsPerBlock / 2);
const selectedWordFirst = jsPsych.randomization.repeat([true, false], numSamplingTrialsPerBlock / 2);

for (let i =0; i < numSamplingBlocks; i++) {
  
  for (let j =0; j < numSamplingTrialsPerBlock; j++) {
		
	var samplingTrial = {
    type: jsPsychSampling,
      stimuli_set: sampling_stims, 
      selected_learning_location: locations[j][0], //  location
      random_learning_location: locations[j][1],
      selected_word_first: selectedWordFirst[j],
    	data: {block: i+1, samplingTrial: j+1}
	};
	
	samplingPhase.push(samplingTrial);

};
};

// ------------------------------------------------  TESTING PHASE  -----------------------------------------------------------------

// builds one test phase: instructions + one comprehension trial per novel word (random order)
const make_test_phase = (instruction_text) => {
  const target_words = jsPsych.randomization.shuffle(stims);   // each novel word tested once, random order

  const instructions = {
    type: jsPsychInstructions,
    pages: [instruction_format(instruction_text)],
    show_clickable_nav: true
  };

  const test_trials = target_words.map((target) => ({
    type: jsPsychComprehensionTest,
    stimuli_set: jsPsych.randomization.shuffle(stims),   // new location for stims each trial
    target_word: target.word,
  }));

  return [instructions].concat(test_trials);
};

var postTrainingTestPhase = make_test_phase(
  `Now we will test how well you learned the words. You will see a name and be asked to choose which of the eight pictured aliens goes with the name. In each trial, click START. The name for one of the aliens will appear on the screen. Click on the alien you think the name refers to. Click NEXT to get started.`,);

var postSamplingTestPhase = make_test_phase(
  `Now we will test how well you learned the words again. Just like before, you will see a name and be asked to choose which of the eight pictured aliens goes with the name. In each trial, click START. The name for one of the aliens will appear on the screen. Click on the alien you think the name refers to. Click NEXT to get started.`,);

// ------------------------------------------------  EXPERIMENT TIMELINE  -----------------------------------------------------------------
timeline.push(preload);

// direct replication of experiment s1  
timeline = timeline.concat(instructionsAttentionCheck); // general instructions + audio check trials
timeline = timeline.concat(trainingPhase);
timeline = timeline.concat(postTrainingTestPhase); 

// exploratory: these are the additonal blocks added after the full s1
timeline = timeline.concat(samplingPhase);
timeline = timeline.concat(postSamplingTestPhase);
timleine = timeline.concat(samplingPhase); 
timeline = timeline.concat(postSamplingTestPhase);


jsPsych.run(timeline);
