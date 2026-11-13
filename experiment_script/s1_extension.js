/**
 * Author: Urvi Suwal
 * Replication of Sampling to Learn Words: Experiment 1 (Zettersten & Saffran, 2020)
 * Modifications: adding a second set of novel words to learn. One round will be active (as in Exp1) 
 *                and the other round will be passive (either maximally help, no help, or random help)
 */


var jsPsych = initJsPsych({

  show_progress_bar: true,
  // on_finish: function () {
  //   jsPsych.data.displayData();
  // },
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
var sona_id = jsPsych.data.urlVariables()['sona_id']
const instruction_format = (text) => `<div style="max-width: 50em; margin: 0 auto; text-align: left">${text}</div>`;
const numBlocks = 2

// condition assignment is done by DataPipe (balanced across participants) in createExperiment() at the bottom of this file.
// DataPipe returns an index 0..5 (set "number of conditions" to 6 in the DataPipe dashboard), which picks
// one of the 3 passive conditions x 2 block orders below
const conditionTable = [
  {passiveCondition: "passiveMax", blockOrder: ["active", "passiveMax"]},
  {passiveCondition: "passiveMax", blockOrder: ["passiveMax", "active"]},
  {passiveCondition: "passiveMid", blockOrder: ["active", "passiveMid"]},
  {passiveCondition: "passiveMid", blockOrder: ["passiveMid", "active"]},
  {passiveCondition: "passiveMin", blockOrder: ["active", "passiveMin"]},
  {passiveCondition: "passiveMin", blockOrder: ["passiveMin", "active"]},
];
// set in createExperiment() once DataPipe has returned the condition
let passiveCondition;
let blockOrder;

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

var consent = {
  type: jsPsychHtmlButtonResponse,
  stimulus: 
    `<h2>Consent Form</h2>` + instruction_format(`
      You are being invited to participate in a research study titled "Reproducibility of Psychological Science and Instruction." This study is being done by Dr. Bria Long from UC San Diego and associated graduate students in Experimental Methods course. You were selected to participate in this study because you are an adult in the U.S. and have been a represented population in previous psychology studies.<br><br>
      The purpose of this study is to better understand how well previously published studies in the psychological field replicate online and with different populations. Your participation in this research should last approximately 5-30 minutes  If you agree to take part in this study, you may be asked to view a set of stimuli, including pictures, sounds, written text, or videos and then giving some responses via key-presses, verbally, or with paper-and-pencil. We may also observe your choices or preferences among an array of stimuli.  These stimuli will be taken directly from or closely adapted from studies that already exist in the published psychological literature. Stimuli will include, e.g., pictures of objects and human faces, audio and video clips, short text passages, etc. None of the stimuli will be disturbing, threatening, or offensive. The online and in-person experiments described in this protocol will take no more than 30 minutes. An example game you might play would be to click on an image on the screen that matches a word you hear being said out loud. Your total expected time commitment for this study is between 5-30 minutes, and is specified in the study description.<br><br>
      Your participation in this study is completely voluntary and you can withdraw at any time. Choosing not to participate or withdrawing will result in no penalty or loss of benefits to which you are entitled. You are free to skip any question that you choose.<br><br>
      We will not be asking for any personally identifying information, and we will handle responses as confidentially as possible. Your SONA or Prolific IDs will never be tied to your responses on this survey. However, we cannot guarantee the confidentiality of information transmitted over the Internet. To minimize this risk, data containing anything that might be personally identifiable (e.g. Prolific IDs or IP addresses) will be encrypted on transfer and storage and will only be accessible to qualified lab personnel. We will be keeping data collected as part of this experiment indefinitely. This anonymized data (containing neither Prolific IDs nor IP addresses) may be shared with the scientific community or with other participants to be used as stimuli in future studies.<br><br>
      If you have questions about this project or if you have a research-related problem, you may contact the researcher(s), Urvi Suwal, usuwal@ucsd.edu or Dr. Bria Long, brlong@ucsd.edu. If you have any questions concerning your rights as a research subject, you may contact the UC San Diego Office of IRB Administration at irb@ucsd.edu or 858-246-4777.<br><br>
      By participating in this research you are indicating that you are at least 18 years old, have read this consent form, and agree to participate in this research study. Please keep this consent form for your records.`), 
    
  choices: ['Agree']
}; taskIntro.push(consent);

var demographics = {
  type: jsPsychSurveyText,
  questions: [
    {prompt: '* <b>Age</b>',required: true, name: 'age'}, 
    {prompt: '* <b>Gender</b>',required: true, name: 'gender'}, 
    {prompt: '* <b>Is English your first/primary language?</b> (y/n)', required: true, name: 'L1'},
    {prompt: '<i>(If you answered "no" to the question above)</i> <br>What is your first/primary language?', name: 'L1_non_enlgish'},

    {prompt: 'What is your second language?<br>If not applicable, please write NA.', name: 'L2'},
    {prompt: 'Please specify any other language(s) you speak in addition to the primary and secondary language.<br>If not applicable, please write NA.', name: 'other_langs'},
  ]

}; taskIntro.push(demographics);

var instructions = { // general instructions 
  type: jsPsychInstructions,
  pages: [
    // instruction_format('Welcome to this experiment. In this experiment you will learn names for aliens. There will be few different learning tasks as you go.<br><br>You will need to hear audio during the experiment, so make sure you are using an up-to-date browser (Firefox, Chrome, or Safari should all be good options). First, we will check that your audio is working properly. We will play you simple words and ask you to type in what you hear. Pay close attention - we will only accept HITs in which people pass this initial audio test. Make sure your audio is turned on, then click NEXT to start the audio test!'),
    instruction_format('Welcome to the experiment! In this experiment you will learn names for aliens. There will be a few different tasks as you go. You will learn the names for two sets of aliens across the entire experiment. You can track how far along you are in the experiment in the progress bar above.<br><br>You will need to hear audio during the experiment, so make sure you are using an up-to-date browser (Firefox, Chrome, or Safari should all be good options). Please do not refresh this tab to restart the experiment. <br><br>First, we will check that your audio is working properly. We will play you simple words and ask you to type in what you hear. Pay close attention - you must pass this initial audio test for participation. Make sure your audio is turned on, then click NEXT to start the audio test!')
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
        wordOrder2: wordOrder2, 
        data: {round: currentRound, round_condition: samplingType}

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
          data: {block: i+1, samplingTrial: j+1, round: currentRound, round_condition: samplingType}
      };
      samplingPhase.push(activeSamplingTrial);

      };
    };
  } else {
    var stimuliSet = jsPsych.randomization.shuffle(stimuliSet); 
    // which item's word is heard first, balanced 2/2 across the 4 passive trials (as in the active round)
    const selectedWordFirst = jsPsych.randomization.repeat([true, false], numSamplingTrialsPerBlock / 2);

    // the passive pairs are presented in a random order (shuffled once per phase), so the position of a pair
    // (e.g. the ambiguous pair in passiveMid) is not confounded with the kind of information it gives.
    // shuffle the indices rather than the pairs so each trial can record which pair of the condition's list it showed
    const conditionPairs = (passiveCondition === 'passiveMax') ? passiveMax : (passiveCondition === 'passiveMid') ? passiveMid : passiveMin;
    const pairOrder = jsPsych.randomization.shuffle(conditionPairs.map((_, index) => index));

    for (let i =0; i < numSamplingBlocks; i++) {
      for (let j =0; j < numSamplingTrialsPerBlock; j++) {
        const pairIndex = pairOrder[j];
        const currentStimuliPair = conditionPairs[pairIndex];

        // pairs index into the unshuffled set, so indices 0-3 are the ambiguous items and 4-7 the disambiguated ones (as in specifiedStim);
        // the shuffled stimuliSet is only used for the order of the aliens on the screen
        const [stimuli1, stimuli2] = [passive_sampling_stims[currentStimuliPair[0]], passive_sampling_stims[currentStimuliPair[1]]];

        // which side each image appears on in the trial
        const [location1, location2] = jsPsych.randomization.shuffle(["left", "right"]);

          var passiveSamplingTrial = {
            type: jsPsychPassiveSampling,
            stimuli_set: stimuliSet,
            learning_1: stimuli1,
            learning_2: stimuli2,
            learning_1_location: location1, 
            learning_2_location: location2, 
            learning_1_word_first: selectedWordFirst[j],
            data: {
              block: i+1, samplingTrial: j+1, round: currentRound, round_condition: samplingType,
              passive_pair_index: pairIndex,                      // which pair of the condition's list (0-3, in the order it is defined) was shown
              passive_pair: currentStimuliPair.join("-"),         // the pair itself, as item indices (0-3 ambiguous, 4-7 disambiguated)
              passive_pair_order: pairOrder.join("-")             // the full shuffled order for this phase
            }

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
    data: {round: currentRound, round_condition: samplingType}
  }));

  return [instructions].concat(test_trials);
};




// the rest of the timeline depends on the condition, so it is built after DataPipe assigns one (see createExperiment)
function buildTimeline() {
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


  // end of experiment debrief
  timeline.push({
    type: jsPsychInstructions,
    pages: [instruction_format(`
      <b>Thanks for participating!</b><br>
      <br>This is an experiment in which you were asked to learn words by keeping track of which words occurred with which aliens across time. We are interested in how people represent uncertainty and make decisions about what to learn next.<br>
      <br>Please click <i>End Study</i> to submit your responses. Please wait for the screen to say "Done" before you close this tab.`)], 
    allow_backward: false, 
    show_clickable_nav: true, 
    button_label_next: "End Study"
  });
}


// ask DataPipe for a balanced condition assignment, then build and run the timeline for that condition
async function createExperiment() {
  let conditionIndex;
  try {
    conditionIndex = await jsPsychExtensionPipe.getCondition("hxixbjitXwxr");
  } catch (error) {
    document.body.innerHTML = "<p>The experiment could not be started.</p>";
    throw error;
  }

  const assigned = conditionTable[conditionIndex];
  if (!assigned) {
    document.body.innerHTML = "<p>The experiment could not be started.</p>";
    throw new Error("DataPipe returned condition " + conditionIndex + ", but conditionTable only has " + conditionTable.length + " entries");
  }
  passiveCondition = assigned.passiveCondition;
  blockOrder = assigned.blockOrder;

  const condition = blockOrder[0] + "_" + blockOrder[1];
  jsPsych.data.addProperties({
    subject_id: subject_id,
    sona_id: sona_id,
    condition: condition,
    conditionIndex: conditionIndex,
    passiveCondition: passiveCondition,
    activeFirst: blockOrder[0] === "active"
  });
  // console.log("condition: " + conditionIndex + " (" + condition + ")");

  buildTimeline();
  jsPsych.run(timeline);
}
createExperiment();
