var jsPsychLearning = (function (jspsych) {
    "use strict";
    
    const info = {
        name: "learning",
        version: "1.0.0",
        parameters: {
            // stimuli item 1: { image, audio, word }
            stimuli1: {
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
            
            // stimuli item 2: { image, audio, word }
            stimuli2: {
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
            
            // the side of the screen stimuli 1 should appear (left vs right)
            location1: {
                type: jspsych.ParameterType.STRING,
                default: "left",
            },

            // the side of the screen stimuli 2 should appear (left vs right) 
            location2: {
                type: jspsych.ParameterType.STRING,
                default: "right",
            },

            // when stimuli 1's word is presented (0 = first, 1 = second)
            wordOrder1: {
                type: jspsych.ParameterType.INT,
                default: 0,
            },

            // when stimuli 2's word is presented (0 = first, 1 = second)
            wordOrder2: {
                type: jspsych.ParameterType.INT,
                default: 1,
            },

            // text shown above the images
            prompt: {
                type: jspsych.ParameterType.STRING,
                default: "Learn the names for the two aliens!",
            },

            // label of the button that starts the words
            button_label: {
                type: jspsych.ParameterType.STRING,
                default: "START",
            },

            // how long each word stays fully visible (ms)
            duration: {
                type: jspsych.ParameterType.INT,
                default: 1000, // from original script
            },

            // how long the screen stays blank after the words, before the next trial (ms)
            blank_duration: {
                type: jspsych.ParameterType.INT,
                default: 500, // timing_post_trial from original script
            },


            // [width, height]
            // 100vh x 25vh (4:1), scaled to the window height,
            // unless the window is too narrow for that, then 80vw x 20vw (still 4:1)
            container_size: {
                type: jspsych.ParameterType.STRING,
                array: true,
                default: ['min(100vh, 80vw)', 'min(25vh, 20vw)'],
            },
            
        },
        data: {
            rt: { type: jspsych.ParameterType.INT },
            image1: { type: jspsych.ParameterType.STRING },
            audio1: { type: jspsych.ParameterType.STRING },
            word1: { type: jspsych.ParameterType.STRING },
            image2: { type: jspsych.ParameterType.STRING },
            audio2: { type: jspsych.ParameterType.STRING },
            word2: { type: jspsych.ParameterType.STRING },
            item_condition1: { type: jspsych.ParameterType.STRING }, // ambiguous vs disambiguated
            item_condition2: { type: jspsych.ParameterType.STRING },
            location1: { type: jspsych.ParameterType.STRING },
            location2: { type: jspsych.ParameterType.STRING },
            wordOrder1: { type: jspsych.ParameterType.INT },
            wordOrder2: { type: jspsych.ParameterType.INT },
        },
    };

    

    /**
         * plugin for learning trials in cross-situational word learning study
         * 
         * adapted re-implementation of the jspsych-learning-prompt and jspsych-learning plugins
         * used in Experiment S1 (crossact version 2) 
         * Martin Zettersten 
         *  
         * functionality: 
         *      - presents two image objects, 
         *      - then presents their two labels (text and audio) on button press
         * 
         * @author Urvi Suwal
         * Implemented using jsPsych 8 and Claude Code assistance
     */
    class LearningPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        
        trial(display_element, trial) {
            const CONTAINER_WIDTH = trial.container_size[0]; 
            const CONTAINER_HEIGHT = trial.container_size[1]; 
            
            // the container is the complete area in which all elements of the trial will be displayed  
            // const values listed below are in relation to the container, where it is considered
            // that the container width and height are 100w x 100h (by default 100vh x 25vh, or 80vw x 20vw on narrow windows)
            const IMAGE_SIZE = 18;
            const CIRCLE_DISTANCE = 12; // gap between the outer edges of the two circles
            const CIRCLE_BORDER = 0.5;
            const CIRCLE_DIAMETER = 22; // (including border)
            const PROMPT_FONT_SIZE = 2.1; 
            const PROMPT_GAP = 4; // gap between the bottom of the prompt and the top of the container
            const WORD_FONT_SIZE = 2.1;
            const BUTTON_FONT_SIZE = 1.7;
            const FADE_MS = 150; // word fade in/out duration, from the original script

            // claude: converts a value in w units (percent of the container width) to a css length;
            // used for sizes so circles stay round even though the container is not square
            const w = (n) => `calc(${CONTAINER_WIDTH} * ${n / 100})`;

           

            // prompt text above the container
            // same width as the container so it is centered over it
            const prompt = document.createElement("div");
            prompt.className = 'jspsych-learning-prompt';
            prompt.textContent = trial.prompt;
            prompt.style.cssText = `
                width: ${CONTAINER_WIDTH};
                margin: 0 auto ${w(PROMPT_GAP)} auto;
                text-align: center;
                white-space: nowrap;
                font-size: ${w(PROMPT_FONT_SIZE)};
                line-height: 1;
                font-weight: bold;
            `;
            display_element.appendChild(prompt);

            // learning trial container within the plugin display
            // plugin default --> 4:1 container scaled to the screen's height (25% of it), capped at 80% of the screen's width
            const container = document.createElement("div");
            container.id = "jspsych-learning-container";
            container.style.cssText = `
                position: relative;
                width: ${CONTAINER_WIDTH};
                height: ${CONTAINER_HEIGHT};
                margin-bottom: 50vh;
                // border: 1px solid #000;

            `;

            display_element.appendChild(container);


            // claude: circle centers, symmetric around the middle of the container: each center is half the gap
            // plus a radius away from the middle, so the edges are CIRCLE_DISTANCE apart
            const center_offset = (CIRCLE_DISTANCE + CIRCLE_DIAMETER) / 2;
            const CIRCLE_CENTERS = {
                left: 50 - center_offset,
                right: 50 + center_offset,
            };
            

            // claude assistance: circle with an image centered inside it
            const make_circle = (location, image_src, ) => {
                
                const circle = document.createElement("div");
                circle.className = "jspsych-learning-circle";
                circle.style.cssText = `
                    position: absolute;
                    left: ${CIRCLE_CENTERS[location]}%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    box-sizing: border-box;
                    width: ${w(CIRCLE_DIAMETER)};
                    height: ${w(CIRCLE_DIAMETER)};
                    border: ${w(CIRCLE_BORDER)} solid #000;
                    border-radius: 50%;
                    background: #FFD3D6;
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

            // each stimulus goes in the circle on its own side
            container.appendChild(make_circle(trial.location1, trial.stimuli1.image));
            container.appendChild(make_circle(trial.location2, trial.stimuli2.image));

            // claude assistance: start button in the middle of the container, between the circles
            const button = document.createElement("button");
                button.id = "jspsych-learning-btn";
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
                    max-width: ${w(CIRCLE_DISTANCE)};
                    overflow: hidden;
                    text-overflow: ellipsis;
                `;
            container.appendChild(button);

            // word display in the middle of the container (where the button was); hidden until faded in
            const word_display = document.createElement("div");
            word_display.className = "jspsych-learning-word";
            word_display.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                white-space: nowrap;
                font-size: ${w(WORD_FONT_SIZE)};
                font-weight: bold;
                opacity: 0;
                transition: opacity ${FADE_MS}ms linear;
            `;
            container.appendChild(word_display);

            // the stimulus whose wordOrder is 0 is presented first
            const words = trial.wordOrder1 === 0
                ? [trial.stimuli1, trial.stimuli2]
                : [trial.stimuli2, trial.stimuli1];

            const wait = (ms) => new Promise((resolve) => this.jsPsych.pluginAPI.setTimeout(resolve, ms));

            // fades the word display in or out via its css opacity transition (FADE_MS)
            const fade = (to) => {
                word_display.style.opacity = to;
                return wait(FADE_MS);
            };

            // each word fades in, its audio plays, it stays for `duration`, then fades out
            const present_words = async () => {
                // audio players for both words, from the files loaded by jsPsychPreload (loaded here if they weren't)
                const players = await Promise.all(
                    words.map((word) => this.jsPsych.pluginAPI.getAudioPlayer(word.audio)));

                for (let i = 0; i < words.length; i++) {
                    word_display.textContent = words[i].word;
                    await fade(1);
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
                        await fade(0);
                    }
                }
                end_trial();
            };

            let rt = null; // set reaction time variable 
            let start_time = null; 

            
            // once both images have loaded, enable start button and start the clock 
            button.disabled = true;
            const images = container.querySelectorAll("img");
            Promise.all([...images].map((image) => image.decode())).then(() => {
                button.disabled = false;
                start_time = performance.now();
            });

            // START button functionality
            button.addEventListener("click", () => {
                rt = Math.round(performance.now() - start_time); // calculates reaction time
                button.remove(); // remove after pressing
                present_words(); // call the function to display+audio for the words 
            });


            const end_trial = () => {
                display_element.innerHTML = "";

                const trial_data = {
                    rt: rt,
                    image1: trial.stimuli1.image,
                    audio1: trial.stimuli1.audio,
                    word1: trial.stimuli1.word,
                    image2: trial.stimuli2.image,
                    audio2: trial.stimuli2.audio,
                    word2: trial.stimuli2.word,
                    item_condition1: trial.stimuli1.item_condition,
                    item_condition2: trial.stimuli2.item_condition,
                    location1: trial.location1,
                    location2: trial.location2,
                    wordOrder1: trial.wordOrder1,
                    wordOrder2: trial.wordOrder2,
                };

                // screen is already cleared; keep it blank for blank_duration before the next trial
                this.jsPsych.pluginAPI.setTimeout(() => {
                    this.jsPsych.finishTrial(trial_data);
                }, trial.blank_duration);
            };
        }
    }
    LearningPlugin.info = info;
    return LearningPlugin;
})(jsPsychModule);
