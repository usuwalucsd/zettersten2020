/**
 * Author: Urvi Suwal
 * Replication of Sampling to Learn Words: Experiment 1 (Zettersten & Saffran, 2020)
 * Modifications: adding a second set of novel words to learn. One round will be active (as in Exp1) 
 *                and the other round will be passive (either maximally help, no help, or random help)
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
const instruction_format = (text) => `<div style="max-width: 50em; margin: 0 auto; text-align: left">${text}</div>`;
const passiveCondition = jsPsych.randomization.sampleWithoutReplacement(["passiveMax", "passiveMid", "passiveMin"], 1)[0]; // randomly assign participants to one of the three conditions
const numBlocks = 2
const blockOrder = jsPsych.randomization.shuffle(['active', passiveCondition]); 

const condition = blockOrder[0]+"_" + blockOrder[1]; 
jsPsych.data.addProperties({
  subject_id: subject_id, 
  condition: condition, 
  passiveCondition: passiveCondition, 
  activeFirst: (blockOrder[0] === 'active') ? true : false
});

console.log("condition: " + condition);

var wordItems = ["beppo","biffer","deela","finna","guffi", "kita","leemu","manu", "noopy","pahvy", "roozer", "sibu","soma", "tesser","tibble","zeevo"];
var imageItems = [29, 18, 10, 11, 12, 14, 17, 7, 8, 9, 4, 5, 6, 3, 2, 1];
var audio_check_files = ['stimuli/audio1.m4a','stimuli/audio2.m4a','stimuli/audio3.m4a','stimuli/audio4.m4a'];

// randomize the order of the words, images, and audio check items
wordItems = jsPsych.randomization.shuffle(wordItems); 
imageItems = jsPsych.randomization.shuffle(imageItems); 
audio_check_files = jsPsych.randomization.shuffle(audio_check_files); 

// randomly pair image and words to the stims dictionary
// stims[i] = {image, word, audio}
const all_stims = wordItems.map((word, i) => ({
  image: `stimuli/${imageItems[i]}.png`,
  word: word,
  audio: `stimuli/${word}.m4a`
}));

// item condition is set by an item's index in its round's set, as in the original script (cur_ambiguity_roles)
// MUST MATCH specifiedStim: items 0-3 always appear with the same partner (ambiguous), items 4-7 appear with three different partners (disambiguated)
const item_conditions = ["ambiguous", "ambiguous", "ambiguous", "ambiguous", "disambiguated", "disambiguated", "disambiguated", "disambiguated"];
const add_item_conditions = (stims) => stims.map((stim, i) => ({ ...stim, item_condition: item_conditions[i] }));

const active_sampling_stims = add_item_conditions(jsPsych.randomization.shuffle(all_stims.slice(0, 8)));
const passive_sampling_stims = add_item_conditions(jsPsych.randomization.shuffle(all_stims.slice(8, 16)));

var timeline = []; 

// --------------------------------------  PRELOAD   -------------------------------------------------------
// load all images and audio before the experiment starts (as in the original script),
// so the words play on time and the aliens appear without delay
var preload = {
  type: jsPsychPreload,
  images: all_stims.map((stim) => stim.image),
  audio: all_stims.map((stim) => stim.audio).concat(audio_check_files), // novel words + audio check words
}; timeline.push(preload);

// --------------------------  TASK INTRO  --------------------------
var taskIntro = []
var fullscreen = {
  type: jsPsychFullscreen,
  message: `<p>The experiment will launch in fullscreen mode when you click the button below.</p>`, 
  button_label: `Launch Experiment`, 
  fullscreen_mode: true
}; taskIntro.push(fullscreen);

var PID = {
  type: jsPsychSurveyText,
  questions: [
    {prompt: 'Please enter your PID, name:',required: true}
  ]
}; taskIntro.push(PID);


var instructions = { // general instructions
  type: jsPsychInstructions,
  pages: [
    // instruction_format('Welcome to this experiment. In this experiment you will learn names for aliens. There will be few different learning tasks as you go.<br><br>You will need to hear audio during the experiment, so make sure you are using an up-to-date browser (Firefox, Chrome, or Safari should all be good options). First, we will check that your audio is working properly. We will play you simple words and ask you to type in what you hear. Pay close attention - we will only accept HITs in which people pass this initial audio test. Make sure your audio is turned on, then click NEXT to start the audio test!'),
    instruction_format('Welcome to the experiment! In this experiment you will learn names for aliens. There will be a few different tasks as you go. You will learn the names for two sets of aliens across the entire experiment. You can track how far along you are in the experiment in the progress bar above.<br><br>You will need to hear audio during the experiment, so make sure you are using an up-to-date browser (Firefox, Chrome, or Safari should all be good options). First, we will check that your audio is working properly. We will play you simple words and ask you to type in what you hear. Pay close attention - we will only accept HITs in which people pass this initial audio test. Make sure your audio is turned on, then click NEXT to start the audio test!')
  ],
  show_clickable_nav: true
}; taskIntro.push(instructions); 

// auditory attention check
// part of the exclusion criteria if participants do not identify the correct word 
// that they hear in the audio 

const audio_check = {
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
}

var audio_check_1 = {
  timeline: [audio_check], 
  timeline_variables: [
    {audio: audio_check_files[0]},
    {audio: audio_check_files[1]},
  ], 
  randomize_order: true,
}; taskIntro.push(audio_check_1);

var audio_check_2 = {
  timeline: [audio_check], 
  timeline_variables: [
    {audio: audio_check_files[2]},
    {audio: audio_check_files[3]},
  ], 
  randomize_order: true,
};

instructions = { // general instructions 
  type: jsPsychInstructions,
  pages: [
    instruction_format( "Great! Now, let's begin with the experiment. In the first task, you will learn the names for 8 different alien creatures. On each trial, you will see two aliens and hear and read two names. At first, you won't know which name goes with which alien because the names appear <b>in random order</b>. Try to figure out over time which name goes with which alien. Please do not write any information down - just do your best to remember and learn the names as you go. Remember that you'll hear the name for each of the two aliens and read them on the screen, but the order of the names will be completely random (so, for example, the first name that appears does not necessarily go with the left alien). Make sure your audio is still on, then click NEXT to start learning!")
  ],
  show_clickable_nav: true
}; taskIntro.push (instructions); 


//  -------------------------- BUILDING EXPERIMENT  --------------------------

// Note: Hard coded stimulis combination are from the original experiment script that was available in OSF
// There are two learning blocks, each block has 12 cross-situational trials, each showing 2 object (pairs of indices into stims);
// every object appears 3 times per block, and the same 12 pairs are reshuffled for each of the 2 blocks
// - object 0-3: the fully ambiguous set, depending on condition
// - object 4-7: the disambiguated set; each appears with three different partners
const specifiedStim = [[0,1],[0,1],[0,1],[2,3],[2,3],[2,3],[4,5],[4,6],[4,7],[5,6],[5,7],[6,7]];



// -----------------------------------------  TRAINING PHASE  -----------------------------------------
var trainingPhase = []; 

function createTrainingPhase(samplingType, currentRound) {
  var trainingPhase = [];
  const stimuliSet = (samplingType === 'active') ? active_sampling_stims : passive_sampling_stims;
  const numTrainingBlocks = 2; 
  const numTrainingTrialsPerBlock = specifiedStim.length; // 12 from the specified stim list 
  for (let block = 0; block < numTrainingBlocks; block++){
    // randomly ordered pairs of stimuli that appear on each training phase trial 
    var currentTrainingBlockTrials = jsPsych.randomization.shuffle(specifiedStim);

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

      const [stimuli1, stimuli2] = [stimuliSet[currentStimuliPair[0]], stimuliSet[currentStimuliPair[1]]]; 

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
  return trainingPhase; 
}

// --------------------------  SAMPLING PHASE  --------------------------

const passiveMax =  [[0,4],[1,5],[2,6],[3,7]];
const passiveMin = [[0,1],[2,3],[4,5],[6,7]];
const passiveMid = [[0,4], [1,5], [2,3], [6,7]];

function createSamplingPhase(samplingType, currentRound) {
  var samplingPhase = [];
  const numSamplingBlocks = 1; 
  const numSamplingTrialsPerBlock = 4; 
  var stimuliSet = (samplingType === 'active') ? active_sampling_stims : passive_sampling_stims;
 
  const active_sampling_instructions = `Next, you will get a chance to choose which alien to learn about next. On each trial, you will see all 8 aliens on the screen. Then, you will get to choose which of the 8 aliens you would like to appear in the next learning trial. After you choose an alien, another alien will be chosen at random by the computer.
    Then, you will see a new learning trial - just like the ones you just saw - with two aliens: the alien you picked and the alien chosen at random. Remember that we will test how well you learned the words later, so try to make choices that will help you learn the names! Click NEXT to get started.`
  

  const passive_sampling_instructions = `Next, you will get a chance to learn more about the names of the aliens. On each trial, you will see all 8 aliens on the screen. Next, two aliens will be chosen at random by the computer.
    Then, you will see a new learning trial - just like the ones you just saw - with these two aliens. Remember that we will test how well you learned the words later, so try to learn the names! Click NEXT to get started.`
  
  
  var samplingInstructions = {
    type: jsPsychInstructions,
    pages: [instruction_format((samplingType === 'active') ? active_sampling_instructions : passive_sampling_instructions)],
    show_clickable_nav: true
  }; samplingPhase.push(samplingInstructions);




  if (samplingType === 'active') {
  
    var stimuliSet = jsPsych.randomization.shuffle(stimuliSet); 
    const locations = jsPsych.randomization.repeat([["left", "right"], ["right", "left"]], numSamplingTrialsPerBlock / 2);
    const selectedWordFirst = jsPsych.randomization.repeat([true, false], numSamplingTrialsPerBlock / 2);

    for (let i =0; i < numSamplingBlocks; i++) {
      
      for (let j =0; j < numSamplingTrialsPerBlock; j++) {
        
      var activeSamplingTrial = {
        type: jsPsychSampling,
          stimuli_set: stimuliSet, 
          selected_learning_location: locations[j][0], //  location
          random_learning_location: locations[j][1],
          selected_word_first: selectedWordFirst[j],
          data: {block: i+1, samplingTrial: j+1, round: currentRound}
      };
      samplingPhase.push(activeSamplingTrial);

      };
    };
  } else {
    var stimuliSet = jsPsych.randomization.shuffle(stimuliSet); 

    for (let i =0; i < numSamplingBlocks; i++) {
      for (let j =0; j < numSamplingTrialsPerBlock; j++) {
        const samplingPairs = (passiveCondition === 'passiveMax') ? passiveMax : (passiveCondition === 'passiveMid') ? passiveMid : passiveMin;
        const currentStimuliPair = samplingPairs[j];
        const selectedWordFirst = jsPsych.randomization.repeat([true, false], numSamplingTrialsPerBlock / 2);

        const [stimuli1, stimuli2] = [stimuliSet[currentStimuliPair[0]], stimuliSet[currentStimuliPair[1]]]; 

        // which side each image appears on in the trial
        const [location1, location2] = jsPsych.randomization.shuffle(["left", "right"]);
      
          var passiveSamplingTrial = {
            type: jsPsychPassiveSampling,
            stimuli_set: stimuliSet,
            learning_1: stimuli1,
            learning_2: stimuli2,
            learning_1_location: location1, 
            learning_2_location: location2, 
            learning_1_word_first: selectedWordFirst[j]
          };
          samplingPhase.push(passiveSamplingTrial);
        }

    
    }; 
  }

  return samplingPhase;

}

// --------------------------  TEST PHASE  --------------------------
// builds one test phase: instructions + one comprehension trial per novel word (random order)
const make_test_phase = (samplingType, currentRound) => {
  const stimuli_set = (samplingType === 'active') ? active_sampling_stims : passive_sampling_stims;
  const target_words = jsPsych.randomization.shuffle(stimuli_set);   // each novel word tested once, random order

  const instructions = {
    type: jsPsychInstructions,
    pages: [instruction_format(`Now we will test how well you learned the words. You will see a name and be asked to choose which of the eight pictured aliens goes with the name. In each trial, click START. The name for one of the aliens will appear on the screen. Click on the alien you think the name refers to. Click NEXT to get started.`,)],
    show_clickable_nav: true
  };

  const test_trials = target_words.map((target) => ({
    type: jsPsychComprehensionTest,
    stimuli_set: jsPsych.randomization.shuffle(target_words),   // new location for stims each trial
    target_word: target.word,
    data: {round: currentRound}
  }));

  return [instructions].concat(test_trials);
};




timeline.push(taskIntro);
timeline.push(createTrainingPhase(blockOrder[0], 1)); 
timeline.push(createSamplingPhase(blockOrder[0], 1));
timeline.push(make_test_phase(blockOrder[0], 1)); 

timeline.push({
  type: jsPsychInstructions,
  pages: [instruction_format(`Great job! Now, you will complete another round of the experiment with a brand new set of aliens.
    Just like at the beginning of the last round, we will first check that your audio is still working properly. We will play you simple words and ask you to type in what you hear. Remember that we will only accept HITs in which people pass this audio test. Click NEXT to start the audio test!`)], 
  show_clickable_nav: true
});

timeline.push(audio_check_2);

timeline.push({
  type: jsPsychInstructions,
  pages: [instruction_format(`Great! Now, let's begin with the new round, with a new set of aliens. These aliens and their names will be completely different and are not related to the aliens you just learned about.
    Just like earlier, you will learn the names for 8 brand new alien creatures. On each trial, you will see two aliens and hear and read two names. As before, you won't know at first which name goes with which alien because the names appear in random order. Try to figure out over time which name goes with which alien. Please do not write any information down - just do your best to remember and learn the names as you go. Remember that you'll hear the name for each of the two aliens and read them on the screen, but the order of the names will be completely random (so, for example, the first name that appears does not necessarily go with the left alien). Make sure your audio is still on, then click NEXT to start learning!`)], 
  show_clickable_nav: true
});


timeline.push(createTrainingPhase(blockOrder[1], 2)); 
timeline.push(createSamplingPhase(blockOrder[1], 2));
timeline.push(make_test_phase(blockOrder[1], 2)); 

// demographics 
timeline.push({
  type: jsPsychSurveyText,
  questions: [
    {prompt: 'Age',required: true}, 
    {prompt: 'Gender',required: true}, 
  ]
  
})

jsPsych.run(timeline);
