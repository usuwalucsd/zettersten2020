var jsPsychPassiveSampling = (function (jspsych) {
    "use strict";
    
    const info = {
        name: "passive sampling",
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

            // first item of the learning trial, provided instead of being sampled: {image, audio, word}
            // must be one of the items in stimuli_set (matched by image)
            learning_1: {
                type: jspsych.ParameterType.COMPLEX,
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

            // second item of the learning trial: {image, audio, word}, also one of the items in stimuli_set
            learning_2: {
                type: jspsych.ParameterType.COMPLEX,
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

            // the side of the learning container learning_1 appears on (left vs right)
            learning_1_location: {
                type: jspsych.ParameterType.STRING,
                default: "right",
            },

            // the side of the learning container learning_2 appears on (left vs right)
            learning_2_location: {
                type: jspsych.ParameterType.STRING,
                default: "left",
            },

            // whether learning_1's word is presented first (true; false if learning_2's word is first)
            learning_1_word_first: {
                type: jspsych.ParameterType.BOOL,
                default: true,
            },

            // label of the button in the learning container
            button_label: {
                type: jspsych.ParameterType.STRING,
                default: "START",
            },

            // label of the button that starts the random selection
            select_button_label: {
                type: jspsych.ParameterType.STRING,
                default: "SELECT RANDOM ALIENS", // from the original script
            },

            // how long each word stays fully visible (ms)
            duration: {
                type: jspsych.ParameterType.INT,
                default: 1000, // from original script
            },

            // how long the screen stays blank after the words, before the next trial (ms)
            blank_duration: {
                type: jspsych.ParameterType.INT,
                default: 500, //  from original script
            },

            // [width, height] of the learning container (top), same as the container in jspsych-learning
            learning_container_size: {
                type: jspsych.ParameterType.STRING,
                array: true,
                default: ['min(100vh, 80vw)', 'min(25vh, 20vw)'],
            },

            // [width, height] of the sampling container (bottom); same width as the learning container
            sampling_container_size: {
                type: jspsych.ParameterType.STRING,
                array: true,
                default: ['min(100vh, 80vw)', 'min(50vh, 40vw)'],
            },

            
        },
        data: {
            rt: { type: jspsych.ParameterType.INT }, // starts: select button is enabled, ends: pressing the select button
            learning_start_rt: { type: jspsych.ParameterType.INT }, // starts: learning container appears, ends: pressing start
            stimuli_set: { type: jspsych.ParameterType.COMPLEX, array: true },
            learning_1_index: { type: jspsych.ParameterType.INT }, // index of learning_1 in stimuli_set
            learning_1_image: { type: jspsych.ParameterType.STRING },
            learning_1_word: { type: jspsych.ParameterType.STRING },
            learning_2_index: { type: jspsych.ParameterType.INT }, // index of learning_2 in stimuli_set
            learning_2_image: { type: jspsych.ParameterType.STRING },
            learning_2_word: { type: jspsych.ParameterType.STRING },
            learning_1_location: { type: jspsych.ParameterType.STRING },
            learning_2_location: { type: jspsych.ParameterType.STRING },
            learning_1_word_first: { type: jspsych.ParameterType.BOOL },
            word1: { type: jspsych.ParameterType.STRING }, // word presented first
            word2: { type: jspsych.ParameterType.STRING }, // word presented second
        },
    };

    

    /**
         * plugin for passive sampling trials in cross-situational word learning study
         * 
         * passive version of jspsych-active-sampling: same presentation, but the two items are provided
         * (learning_1, learning_2) instead of being chosen by the participant and the computer
         *  
         * functionality: 
         *      - displays the full stimuli set
         *      - the participant presses the select button
         *      - learning_1 and learning_2 are highlighted in the set without the participant choosing them
         *      - the participant presses start
         *      - word+audio for learning_1 and learning_2 are displayed to the participant
         * 
         * @author Urvi Suwal
         * Implemented using jsPsych 8
     */
    class PassiveSamplingPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        
        trial(display_element, trial) {
            const LEARNING_CONTAINER_WIDTH = trial.learning_container_size[0];
            const LEARNING_CONTAINER_HEIGHT = trial.learning_container_size[1];
            const SAMPLING_CONTAINER_WIDTH = trial.sampling_container_size[0];
            const SAMPLING_CONTAINER_HEIGHT = trial.sampling_container_size[1];

            // learning container
            // identical to the one in the jspsych-learning plugin
            const learning_container = document.createElement("div");
            learning_container.id = "jspsych-sampling-learning-container";
            learning_container.style.cssText = `
                position: relative;
                width: ${LEARNING_CONTAINER_WIDTH};
                height: ${LEARNING_CONTAINER_HEIGHT};
                margin: 0 auto;
                /* border: 1px solid #000; */
            `;

            // sampling container 
            const sampling_container = document.createElement("div");
            sampling_container.id = "jspsych-sampling-sampling-container";
            sampling_container.style.cssText = `
                position: relative;
                width: ${SAMPLING_CONTAINER_WIDTH};
                height: ${SAMPLING_CONTAINER_HEIGHT};
                margin: 0 auto;
                /* border: 1px solid #000; */
            `;

            display_element.appendChild(learning_container);
            display_element.appendChild(sampling_container);

            // for experimenters: change the values below to customize 
            const IMAGE_SIZE =18;
            const LEARNING_CIRCLE_DISTANCE = 12; 
            const SAMPLING_CIRCLE_DISTANCE = 1.5; 
            const CIRCLE_BORDER = 0.5;
            const CIRCLE_DIAMETER = 22; 
            const PROMPT_FONT_SIZE = 2.1;
            const PROMPT_GAP = 0.5; // gap between the text and container
            const BUTTON_FONT_SIZE = 1.7;
            const ROW_GAP = 1.5; 
            const PAUSE_MS = 500; // pauses between the steps after a choice, from the original script
            const FADE_MS = 500; // fades after a choice, from the original script
            const PINK = "#FFD3D6";
            const BLUE = "#00ccff";
            const WORD_FONT_SIZE = 2.1; 
            const WORD_FADE_MS = 150;

            const w = (n) => `calc(${LEARNING_CONTAINER_WIDTH} * ${n / 100})`;

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
                    width: ${LEARNING_CONTAINER_WIDTH};
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

            //  text on top of the stimuli set container --> the question for choosing an alien instruction for the learning part 
            //  text on top of the learning container --> press start to hear names 
            //  text between the select button and the stimuli set container --> as in the original passive condition (question1, question2)
            const learning_prompt = add_prompt(`Click start to hear the names of the aliens in random order.`, learning_container);
            const sampling_prompts = [
                add_prompt(`Click on the button above.`, sampling_container),
                add_prompt(`The computer will select two random aliens for you to learn about next.`, sampling_container),
            ];

            // the learning prompt is hidden before the random selection is made; it fades in slowly to appear
            learning_prompt.style.visibility = "hidden";
            learning_prompt.style.opacity = 0;
            learning_prompt.style.transition = `opacity ${FADE_MS}ms linear`;
            // the learning container only holds the select button until the random selection is made,
            // then fades out and back in with the two aliens and the start button
            learning_container.style.transition = `opacity ${FADE_MS}ms linear`;

            // ---------------------------


            // SAMPLING CONTAINER FUNCTIONALITY
            // implemented using the same structure as the jspsych-learning plugin with claude code assistance
            // 8 circles displayed in two rows of 4
            const sampling_images = trial.stimuli_set.map((stimulus) => stimulus.image);
            const CIRCLES_PER_ROW = 4;
            const column_spacing = CIRCLE_DIAMETER + SAMPLING_CIRCLE_DISTANCE; // center to center
            const row_offset = (CIRCLE_DIAMETER + ROW_GAP) / 2; // each row's center from the middle

            // each sampling circle is display-only (participants do not choose in passive sampling)
            const sampling_circles = sampling_images.map((image_src, i) => {
                const row = Math.floor(i / CIRCLES_PER_ROW);
                const column = i % CIRCLES_PER_ROW;
                const left = 50 + (column - (CIRCLES_PER_ROW - 1) / 2) * column_spacing;
                const top = row === 0
                    ? `calc(50% - ${w(row_offset)})`
                    : `calc(50% + ${w(row_offset)})`;
                const circle = make_circle(`${left}%`, top, image_src, BLUE);
                sampling_container.appendChild(circle);
                return circle;
            });

            // positions of the provided items in the grid
            const index_of = (item, name) => {
                const index = trial.stimuli_set.findIndex((stimulus) => stimulus.image === item.image);
                if (index === -1) {
                    throw new Error(`passive sampling: ${name} (${item.image}) is not in stimuli_set`);
                }
                return index;
            };
            const learning_1_index = index_of(trial.learning_1, "learning_1");
            const learning_2_index = index_of(trial.learning_2, "learning_2");

            const wait = (ms) => new Promise((resolve) => this.jsPsych.pluginAPI.setTimeout(resolve, ms));

            // in place of a choice (same timing as jspsych-active-sampling, from the original script):
            // 1. after PAUSE_MS, learning_1's circle fades to pink
            // 2. after another PAUSE_MS, learning_2's circle fades to pink
            // 3. after another PAUSE_MS, all sampling circles fade to 20% opacity and the prompt above them fades out
            // 4. then learning_1 and learning_2 fade in, in the learning container, with the start button
            const highlight = async (index) => {
                await wait(PAUSE_MS);
                const circle = sampling_circles[index];
                circle.style.transition = `background-color ${FADE_MS}ms linear`;
                circle.style.backgroundColor = PINK;
                await wait(FADE_MS);
            };

            const show_learning_items = async () => {
                // 1. and 2. both provided aliens' circles fade to pink, one after the other
                await highlight(learning_1_index);
                await highlight(learning_2_index);

                // 3. sampling circles fade to 20% and the prompt above them fades out
                await wait(PAUSE_MS);
                sampling_circles.forEach((circle) => {
                    circle.style.transition = `opacity ${FADE_MS}ms linear`;
                    circle.style.opacity = 0.2;
                });
                sampling_prompts.forEach((prompt) => {
                    prompt.style.transition = `opacity ${FADE_MS}ms linear`;
                    prompt.style.opacity = 0;
                });
                await wait(FADE_MS);

                // 4. learning_1 and learning_2 in the learning container (pink circles, as in jspsych-learning),
                //    then fade in with the prompt and start button
                learning_container.appendChild(make_circle(
                    LEARNING_CIRCLE_LEFT[trial.learning_1_location], "50%", trial.learning_1.image, PINK));
                learning_container.appendChild(make_circle(
                    LEARNING_CIRCLE_LEFT[trial.learning_2_location], "50%", trial.learning_2.image, PINK));
                learning_container.appendChild(button); // keep the button and word display on top of the circles
                learning_container.appendChild(word_display);
                [learning_prompt, learning_container].forEach((element) => {
                    element.style.visibility = "visible";
                    element.style.opacity = 1;
                });
                await wait(FADE_MS);
                learning_start_time = performance.now();
            };

            // the word display fades in or out via its css opacity transition (WORD_FADE_MS)
            const fade_word = (to) => {
                word_display.style.opacity = to;
                return wait(WORD_FADE_MS);
            };
        
            // ---------------------------

            // LEARNING CONTAINER FUNCTIONALITY
            // follows the same structure and functionality as the jsPsych-learning plugin
            const center_offset = (LEARNING_CIRCLE_DISTANCE + CIRCLE_DIAMETER) / 2;
            const LEARNING_CIRCLE_LEFT = {
                left: `${50 - center_offset}%`,
                right: `${50 + center_offset}%`,
            };

            const button = document.createElement("button");
            button.id = "jspsych-sampling-btn";
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
            // the start button is added to the learning container after the random selection (step 4)

            // select button in the middle of the learning container, starts the random selection (as in the original passive condition)
            const select_button = document.createElement("button");
            select_button.id = "jspsych-passive-sampling-select-btn";
            select_button.className = "jspsych-btn";
            select_button.textContent = trial.select_button_label;
            select_button.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                margin: 0;
                font-size: ${w(BUTTON_FONT_SIZE)};
                padding: 0.43em 0.86em;
                border-radius: 0.29em;
                box-sizing: border-box;
                white-space: nowrap;
            `;
            learning_container.appendChild(select_button);

            // word display in the middle of the learning container (where the button was); hidden until faded in,
            const word_display = document.createElement("div");
            word_display.className = "jspsych-sampling-word";
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
            learning_container.appendChild(word_display);
            



            // as in jspsych-learning: each word fades in, its audio plays, it stays for `duration`, then fades out;
            // learning_1's word comes first if learning_1_word_first, otherwise learning_2's word does
            const present_words = async () => {
                const words = trial.learning_1_word_first
                    ? [trial.learning_1, trial.learning_2]
                    : [trial.learning_2, trial.learning_1];

                // audio players for both words, from the files loaded by jsPsychPreload (loaded here if they weren't)
                const players = await Promise.all(
                    words.map((word) => this.jsPsych.pluginAPI.getAudioPlayer(word.audio)));

                for (let i = 0; i < words.length; i++) {
                    word_display.textContent = words[i].word;
                    await fade_word(1);
                    // claude debug for audio buffer error: players are cached per audio file and a web audio source node can only be started once,
                    // so stop() once it finishes to give the player a fresh node for the next time this word is played
                    const player = players[i];
                    const on_ended = () => {
                        player.removeEventListener("ended", on_ended);
                        player.stop();
                    };
                    player.addEventListener("ended", on_ended);
                    player.play();
                    await wait(trial.duration);
                    // as in the original, the trial ends as soon as the second word's hold is over
                    if (i < words.length - 1) {
                        await fade_word(0);
                    }
                }
                end_trial(words);
            };

            let rt = null; // from the select button being enabled to pressing it
            let learning_start_rt = null; // from the learning container appearing to pressing start
            let start_time = null;
            let learning_start_time = null;

            // the select button is enabled (and rt timing starts) once all the sampling images have loaded
            select_button.disabled = true;
            const sampling_image_elements = sampling_container.querySelectorAll("img");
            Promise.all([...sampling_image_elements].map((image) => image.decode())).then(() => {
                select_button.disabled = false;
                start_time = performance.now();
            });

            // select button: record rt, remove the button, fade the (now empty) learning container out, and start the random selection
            select_button.addEventListener("click", () => {
                rt = Math.round(performance.now() - start_time);
                select_button.remove();
                learning_container.style.opacity = 0;
                show_learning_items();
            });

            // START button: record learning_start_rt, remove the button and present the words, as in jspsych-learning
            button.addEventListener("click", () => {
                learning_start_rt = Math.round(performance.now() - learning_start_time);
                button.remove();
                present_words();
            });

            const end_trial = (words) => {
                display_element.innerHTML = "";

                const trial_data = {
                    rt: rt,
                    learning_start_rt: learning_start_rt,
                    stimuli_set: trial.stimuli_set,
                    learning_1_index: learning_1_index,
                    learning_1_image: trial.learning_1.image,
                    learning_1_word: trial.learning_1.word,
                    learning_2_index: learning_2_index,
                    learning_2_image: trial.learning_2.image,
                    learning_2_word: trial.learning_2.word,
                    learning_1_location: trial.learning_1_location,
                    learning_2_location: trial.learning_2_location,
                    learning_1_word_first: trial.learning_1_word_first,
                    word1: words[0].word,
                    word2: words[1].word,
                };

                // screen is already cleared; keep it blank for blank_duration before the next trial
                this.jsPsych.pluginAPI.setTimeout(() => {
                    this.jsPsych.finishTrial(trial_data);
                }, trial.blank_duration);
            };
        }
    }
    PassiveSamplingPlugin.info = info;
    return PassiveSamplingPlugin;
})(jsPsychModule);
