var jsPsychComprehensionTest = (function (jspsych) {
    "use strict";
    
    const info = {
        name: "comprehension_test",
        version: "1.0.0",
        parameters: {
            // array of word-item pairs that will be shown in the sampling container, each element should contain {image, audio, word}
            stimuli_set: {
                type: jspsych.ParameterType.COMPLEX,
                array: true,
                default: undefined,
                nested: {
                    image: {
                        type: jspsych.ParameterType.IMAGE,
                        default: undefined,
                    },
                    audio: {
                        type: jspsych.ParameterType.AUDIO,
                        default: undefined,
                    },
                    word: {
                        type: jspsych.ParameterType.STRING,
                        default: undefined,
                    },
                },
            },

            // target word to test comprehension
            target_word: {
                type: jspsych.ParameterType.STRING,
                default: undefined,
            },

            

            // label of the button in the testing container
            button_label: {
                type: jspsych.ParameterType.STRING,
                default: "START",
            },


            // how long the screen stays blank after the words, before the next trial (ms)
            blank_duration: {
                type: jspsych.ParameterType.INT,
                default: 500, //  from original script
            },

            // [width, height] of the testing container (top), same as the container in jspsych-learning
            testing_container_size: {
                type: jspsych.ParameterType.STRING,
                array: true,
                default: ['min(100vh, 80vw)', 'min(25vh, 20vw)'],
            },

            // [width, height] of the afc container (bottom), same as the sampling container in jspsych-sampling
            afc_container_size: {
                type: jspsych.ParameterType.STRING,
                array: true,
                default: ['min(100vh, 80vw)', 'min(50vh, 40vw)'],
            },

            
        },
        data: {
            rt: { type: jspsych.ParameterType.INT }, //  starts: on clicking start button on the learning container, ends: end of trial
            stimuli_set: { type: jspsych.ParameterType.COMPLEX, array: true },
            chosen_image: { type: jspsych.ParameterType.STRING },
            chosen_word: { type: jspsych.ParameterType.STRING },
            target_word: { type: jspsych.ParameterType.STRING },
            chosen_item_condition: { type: jspsych.ParameterType.STRING }, // ambiguous vs disambiguated
            target_item_condition: { type: jspsych.ParameterType.STRING },
            correct: { type: jspsych.ParameterType.BOOL}, 
        },
    };

    

    /**
         * plugin for comprehension test trials in cross-situational word learning study
         * 
         * adapted re-implementation of the jspsych-comprehension-test-prompt and  jspsych-comprehension-test plugins
         * used in Experiment S1 (crossact version 2) 
         * Martin Zettersten 
         *  
         * functionality: 
         *      - add here
         * 
         * @author Urvi Suwal
         * Implemented using jsPsych 8
     */
    class ComprehensionTestPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        
        trial(display_element, trial) {
           
            const TESTING_CONTAINER_WIDTH = trial.testing_container_size[0];
            const TESTING_CONTAINER_HEIGHT = trial.testing_container_size[1];
            const AFC_CONTAINER_WIDTH = trial.afc_container_size[0];
            const AFC_CONTAINER_HEIGHT = trial.afc_container_size[1];

            // testing container
            // identical to the learning container in the jspsych-sampling plugin
            const testing_container = document.createElement("div");
            testing_container.id = "jspsych-comprehension-test-testing-container";
            testing_container.style.cssText = `
                position: relative;
                width: ${TESTING_CONTAINER_WIDTH};
                height: ${TESTING_CONTAINER_HEIGHT};
                margin: 0 auto;
                /* border: 1px solid #000; */
            `;

            // afc container
            // identical to the sampling container in the jspsych-sampling plugin
            const afc_container = document.createElement("div");
            afc_container.id = "jspsych-comprehension-test-afc-container";
            afc_container.style.cssText = `
                position: relative;
                width: ${AFC_CONTAINER_WIDTH};
                height: ${AFC_CONTAINER_HEIGHT};
                margin: 0 auto;
                /* border: 1px solid #000; */
            `;

            display_element.appendChild(testing_container);
            display_element.appendChild(afc_container);

            // for experimenters: change the values below to customize
            const IMAGE_SIZE =18;
            const LEARNING_CIRCLE_DISTANCE = 12; // also the max width of the start button, as in jspsych-sampling
            const SAMPLING_CIRCLE_DISTANCE = 1.5;
            const CIRCLE_BORDER = 0.5;
            const CIRCLE_DIAMETER = 22;
            const PROMPT_FONT_SIZE = 2.1;
            const PROMPT_GAP = 0.5; // gap between the text and container
            const BUTTON_FONT_SIZE = 1.7;
            const ROW_GAP = 1.5;
            const PAUSE_MS = 500; // time between choosing an alien and the end of the trial, from the original script
            const PINK = "#FFD3D6";
            const BLUE = "#00ccff";
            const WORD_FONT_SIZE = 3;
            const WORD_FADE_MS = 150;

            const w = (n) => `calc(${TESTING_CONTAINER_WIDTH} * ${n / 100})`;

            // claude assistance: circle with an image centered inside it
            // tag is "div" for a display-only circle or "button" for a clickable one
            const make_circle = (left, top, image_src, color, tag = "div") => {
                const circle = document.createElement(tag);
                circle.className = "jspsych-sampling-circle";
                circle.style.cssText = `
                    padding: 0;
                    cursor: ${tag === "button" ? "pointer" : "default"};
                    position: absolute;
                    left: ${left};
                    top: ${top};
                    transform: translate(-50%, -50%);
                    box-sizing: border-box;
                    width: ${w(CIRCLE_DIAMETER)};
                    height: ${w(CIRCLE_DIAMETER)};
                    border: ${w(CIRCLE_BORDER)} solid #000;
                    border-radius: 50%;
                    background: ${color};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                const image = document.createElement("img");
                image.src = image_src;
                image.style.cssText = `
                    width: ${w(IMAGE_SIZE)};
                    height: ${w(IMAGE_SIZE)};
                `;

                circle.appendChild(image);
                return circle;
            };

           // text instructions
            const add_prompt = (text, container) => {
                const prompt = document.createElement("div");
                prompt.className = "jspsych-sampling-prompt";
                prompt.textContent = text;
                prompt.style.cssText = `
                    width: ${TESTING_CONTAINER_WIDTH};
                    margin: 0 auto ${w(PROMPT_GAP)} auto;
                    text-align: center;
                    white-space: nowrap;
                    font-size: ${w(PROMPT_FONT_SIZE)};
                    line-height: 1;
                    font-weight: bold;
                `;
                display_element.insertBefore(prompt, container);
                return prompt;
            };

            //  text on top of the testing container --> press start to begin, then which alien to click
            const testing_prompt = add_prompt(`Click on the START button to begin the trial.`, testing_container);

            // TESTING CONTAINER FUNCTIONALITY
            const button = document.createElement("button");
            button.id = "jspsych-comprehension-test-btn";
            button.className = "jspsych-btn";
            button.textContent = trial.button_label;
            button.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                margin: 0;
                font-size: ${w(BUTTON_FONT_SIZE)};
                padding: 0.43em 0.86em;
                border-radius: 0.29em;
                box-sizing: border-box;
                max-width: ${w(LEARNING_CIRCLE_DISTANCE)};
                overflow: hidden;
                text-overflow: ellipsis;
            `;
            testing_container.appendChild(button);

            // target word display in the middle of the testing container (where the button was);
            // hidden until faded in, as in jspsych-sampling
            const word_display = document.createElement("div");
            word_display.className = "jspsych-comprehension-test-word";
            word_display.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                white-space: nowrap;
                font-size: ${w(WORD_FONT_SIZE)};
                font-weight: bold;
                opacity: 0;
                transition: opacity ${WORD_FADE_MS}ms linear;
            `;
            testing_container.appendChild(word_display);

            // AFC CONTAINER FUNCTIONALITY
            // implemented using the same structure as the sampling container in jspsych-sampling
            // 8 circles displayed in two rows of 4
            const afc_images = trial.stimuli_set.map((stimulus) => stimulus.image);
            const CIRCLES_PER_ROW = 4;
            const column_spacing = CIRCLE_DIAMETER + SAMPLING_CIRCLE_DISTANCE; // center to center
            const row_offset = (CIRCLE_DIAMETER + ROW_GAP) / 2; // each row's center from the middle

            // each afc circle is a button; pink and disabled until start is pressed
            const afc_buttons = afc_images.map((image_src, i) => {
                const row = Math.floor(i / CIRCLES_PER_ROW);
                const column = i % CIRCLES_PER_ROW;
                const left = 50 + (column - (CIRCLES_PER_ROW - 1) / 2) * column_spacing;
                const top = row === 0
                    ? `calc(50% - ${w(row_offset)})`
                    : `calc(50% + ${w(row_offset)})`;
                const circle_button = make_circle(`${left}%`, top, image_src, PINK, "button");
                circle_button.disabled = true;
                circle_button.style.cursor = "default";
                afc_container.appendChild(circle_button);
                return circle_button;
            });

            let chosen_index = null; // index (in stimuli_set) of the alien the participant chose
            let rt = null; // starts: on clicking the start button, ends: on choosing an alien
            let start_time = null;

            const wait = (ms) => new Promise((resolve) => this.jsPsych.pluginAPI.setTimeout(resolve, ms));

            // the start button is enabled once all the afc images have loaded
            button.disabled = true;
            const afc_image_elements = afc_container.querySelectorAll("img");
            Promise.all([...afc_image_elements].map((image) => image.decode())).then(() => {
                button.disabled = false;
            });

            // START button: the prompt asks for the target, the button vanishes, the target word is shown,
            // the afc circles are enabled and the rt timer starts
            button.addEventListener("click", () => {
                testing_prompt.textContent = `Click on the ${trial.target_word}`;
                button.remove();
                word_display.textContent = trial.target_word;
                word_display.style.opacity = 1;
                afc_buttons.forEach((circle_button) => {
                    circle_button.disabled = false;
                    circle_button.style.cursor = "pointer";
                });
                start_time = performance.now();
            });

            // after a choice
            const after_choice = async () => {
                // the trial ends 500 ms after a button is pressed
                await wait(PAUSE_MS);
                end_trial();
            };

            // on press: the chosen alien's background turns from pink to blue (#00ccff),
            // and all circles (including the pressed one) are disabled
            afc_buttons.forEach((circle_button, i) => {
                circle_button.addEventListener("click", () => {
                    rt = Math.round(performance.now() - start_time);
                    chosen_index = i;
                    circle_button.style.backgroundColor = BLUE;
                    afc_buttons.forEach((other) => {
                        other.disabled = true;
                        other.style.cursor = "default";
                    });
                    after_choice();
                });
            });

            const end_trial = () => {
                display_element.innerHTML = "";

                const trial_data = {
                    rt: rt,
                    stimuli_set: trial.stimuli_set,
                    chosen_image: trial.stimuli_set[chosen_index].image,
                    chosen_word: trial.stimuli_set[chosen_index].word,
                    target_word: trial.target_word,
                    chosen_item_condition: trial.stimuli_set[chosen_index].item_condition,
                    target_item_condition: trial.stimuli_set.find((stimulus) => stimulus.word === trial.target_word).item_condition,
                    correct: trial.stimuli_set[chosen_index].word === trial.target_word,
                };

                // screen is already cleared; keep it blank for blank_duration before the next trial
                this.jsPsych.pluginAPI.setTimeout(() => {
                    this.jsPsych.finishTrial(trial_data);
                }, trial.blank_duration);
            };

        }
    }
    ComprehensionTestPlugin.info = info;
    return ComprehensionTestPlugin;
})(jsPsychModule);
