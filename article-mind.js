import { getChatAnswer, renderChatAnswer, hasPresetQuestion } from './article-chat.js';
import { createPixelMessage } from './pixel-message.js';

const paragraphs = [...document.querySelectorAll('#article .story-paragraph')];
const articleText = paragraphs.map(paragraph => paragraph.dataset?.originalStory || paragraph.textContent.trim());
const note = document.querySelector('#mind-note');
const line = document.querySelector('#mind-line');
const canvas = document.querySelector('#mind-pixels');
const dialog = document.querySelector('#article-dialog');
const conversation = document.querySelector('#article-conversation');
const question = document.querySelector('[data-question]');
const speechButton = document.querySelector('#mind-speech');
const quietButtons = [...document.querySelectorAll('[data-mind-quiet]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const attentionPrompt = 'Are you paying attention?';
const seriousPrompt = 'Do you realize how serious this is?';
const thoughtsPrompt = 'Any thoughts?';
const pacePrompts = ['Take your time. Let this story sink in.', 'Pause for a moment. Digest what you’re reading.'];
let paceSamples = [], lastReaderScroll = -Infinity, lastPacePrompt = -Infinity, pacePromptIndex = 0;
let quiet = false, voice = false, lastSpoke = 0, lastActivity = Date.now();
let hideTimer, previousFocus, idleCalledOut = false, restoreFocus = true;
let message, messageFrame = 0, messageStarted = 0;
try { quiet = sessionStorage.getItem('article-quiet') === 'yes'; } catch {}

// These browser signals are cues for the imagined voice, not proof of attention.
function canInterrupt() {
  return !quiet && !document.hidden && document.hasFocus() && !document.body.classList.contains('type-water-active') && !document.querySelector('dialog[open], .passage-companion:not([hidden])');
}

function stopSpeech() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function speak() {}

function dismiss() {
  clearTimeout(hideTimer);
  cancelAnimationFrame(messageFrame);
  messageFrame = 0;
  if (note.contains(document.activeElement)) document.querySelector('#pixel-chat-orb').focus({preventScroll: true});
  note.hidden = true;
  stopSpeech();
}

function paintMessage(now) {
  messageFrame = 0;
  if (note.hidden || document.hidden || !document.hasFocus()) return;
  message.draw(reducedMotion.matches ? 0 : now, reducedMotion.matches ? 1 : (now - messageStarted) / 550);
  if (!reducedMotion.matches) messageFrame = requestAnimationFrame(paintMessage);
}

function prepareMessage() {
  cancelAnimationFrame(messageFrame);
  const top = parseFloat(note.style.top) || innerHeight * .45;
  note.style.top = `${Math.max(innerHeight * .27, Math.min(innerHeight * .7, top))}px`;
  message = createPixelMessage(canvas, line.textContent, {
    width: Math.min(920, innerWidth - 32),
    fontSize: Math.min(148, Math.max(76, innerWidth * .19)),
  });
  paintMessage(performance.now());
}

function say(text, passage) {
  if (!canInterrupt()) return false;
  clearTimeout(hideTimer);
  lastSpoke = Date.now();
  line.textContent = text;
  const anchor = passage || paragraphs.find(paragraph => {
    const rect = paragraph.getBoundingClientRect();
    return rect.top < innerHeight * .55 && rect.bottom > innerHeight * .35;
  });
  const rect = anchor?.getBoundingClientRect();
  const top = rect ? (rect.top + rect.bottom) / 2 : innerHeight * .45;
  note.style.top = `${Math.max(innerHeight * .27, Math.min(innerHeight * .7, top))}px`;
  note.hidden = false;
  messageStarted = performance.now();
  prepareMessage();
  speak(text);
  hideTimer = setTimeout(dismiss, 6500);
  return true;
}

document.fonts.load('400 100px Caslon').then(() => { if (!note.hidden) prepareMessage(); });
window.addEventListener('resize', () => { if (!note.hidden) prepareMessage(); });
reducedMotion.addEventListener('change', () => { if (!note.hidden) prepareMessage(); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !note.hidden) dismiss(); });

function updateQuiet() {
  document.body.dataset.articleQuiet = String(quiet);
  quietButtons.forEach(button => {
    button.textContent = quiet ? 'Wake the voice' : 'Quiet the voice';
    button.setAttribute('aria-pressed', String(quiet));
  });
  if (quiet) {
    voice = false;
    speechButton.textContent = 'Voice off';
    speechButton.setAttribute('aria-pressed', 'false');
    dismiss();
  }
  try { sessionStorage.setItem('article-quiet', quiet ? 'yes' : 'no'); } catch {}
}

quietButtons.forEach(button => button.addEventListener('click', () => {
  quiet = !quiet;
  updateQuiet();
  activity();
}));
document.querySelector('#mind-dismiss').addEventListener('click', dismiss);

speechButton.hidden = true;
speechButton.addEventListener('click', () => {
  voice = !voice;
  if (voice && quiet) { quiet = false; updateQuiet(); }
  speechButton.textContent = voice ? 'Voice on' : 'Voice off';
  speechButton.setAttribute('aria-pressed', String(voice));
  if (voice && (dialog.open || !note.hidden)) speak(dialog.open ? thoughtsPrompt : line.textContent);
  else stopSpeech();
});

function openQuestions() {
  if (dialog.open || document.querySelector('dialog[open]')) return;
  previousFocus = note.contains(document.activeElement) ? document.querySelector('#pixel-chat-orb') : document.activeElement;
  restoreFocus = true;
  dismiss();
  dialog.showModal();
  question.focus();
}
document.querySelectorAll('[data-ask-article]').forEach(button => button.addEventListener('click', openQuestions));
document.querySelector('#article-dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  stopSpeech();
  lastActivity = Date.now();
  if (restoreFocus) previousFocus?.focus({preventScroll: true});
});

function addMessage(text, fromArticle, target = conversation) {
  const message = document.createElement('div');
  message.className = `article-message ${fromArticle ? 'article-message-mind' : 'article-message-reader'}`;
  const label = document.createElement('span');
  label.textContent = fromArticle ? 'ARTICLE ASSISTANT' : 'YOU';
  const content = document.createElement('p');
  content.textContent = text;
  message.append(label, content);
  target.append(message);
  return message;
}

const chatHistories = new WeakMap(), pendingChats = new Map();
function cancelChat(target) {
  const pending = pendingChats.get(target);
  if (!pending) return;
  pending.controller.abort(); pending.message.remove(); pendingChats.delete(target);
  target.setAttribute('aria-busy', 'false');
}
dialog.addEventListener('close', () => cancelChat(conversation));
document.addEventListener('readingcompanionopen', () => {
  const target = document.querySelector('.inline-answers');
  cancelChat(target); chatHistories.delete(target);
});
document.addEventListener('readingcompanionclose', () => cancelChat(document.querySelector('.inline-answers')));
document.addEventListener('readingcompaniondismiss', () => cancelChat(document.querySelector('.inline-answers')));

async function ask(value, target = conversation) {
  const text = value.trim().slice(0, 500);
  if (!hasPresetQuestion(text) || pendingChats.has(target)) return;
  addMessage(text, false, target);
  const message = addMessage('Thinking…', true, target);
  target.scrollTop = target.scrollHeight;
  const controller = new AbortController();
  const pending = {controller, message}; pendingChats.set(target, pending);
  target.setAttribute('aria-busy', 'true');
  const timeout = setTimeout(() => controller.abort('timeout'), 75000);
  const history = chatHistories.get(target) || [];
  
  try {
    const answer = await getChatAnswer(text, history, target !== conversation ? Number(target.dataset.passageIndex) : null, controller.signal);
    if (pendingChats.get(target) !== pending || !message.isConnected) return;
    renderChatAnswer(message.querySelector('p'), answer);
    message.querySelector('span').textContent = answer.searched ? 'ARTICLE ASSISTANT · WEB SOURCES' : 'ARTICLE ASSISTANT';
    if (target !== conversation) target.scrollTop = target.scrollHeight;
    chatHistories.set(target, [...history, {role: 'user', content: text}, {role: 'assistant', content: answer.text.slice(0, 4000)}].slice(-6));
    if (answer.sources.length) {
      const sources = document.createElement('div');
      sources.className = 'article-answer-sources';
      for (const index of answer.sources) {
        if (!paragraphs[index]) continue;
        const button = document.createElement('button');
        button.textContent = `Read paragraph ${index + 1} ↗`;
        button.addEventListener('click', () => {
          restoreFocus = false;
          if (dialog.open) dialog.close();
          if (target !== conversation) document.dispatchEvent(new Event('readingcompanionclose'));
          paragraphs.forEach(paragraph => paragraph.classList.remove('mind-source'));
          const paragraph = paragraphs[index];
          paragraph.classList.add('mind-source');
          paragraph.tabIndex = -1;
          paragraph.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center'});
          paragraph.focus({preventScroll: true});
          setTimeout(() => paragraph.classList.remove('mind-source'), 8000);
        });
        sources.append(button);
      }
      message.append(sources);
    }
    if (target === conversation && dialog.open) {
      conversation.scrollTop += message.getBoundingClientRect().top - conversation.getBoundingClientRect().top - 14;
      question.focus(); speak(answer.text);
    }
  } catch (error) {
    if (pendingChats.get(target) !== pending) return;
    message.querySelector('p').textContent = controller.signal.aborted ? 'The answer took too long. Please try again.' : error.message || 'The assistant could not connect. Please try again.';
    target.scrollTop = target.scrollHeight;
  } finally {
    clearTimeout(timeout);
    if (pendingChats.get(target) === pending) { pendingChats.delete(target); target.setAttribute('aria-busy', 'false'); }
  }
}

document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => ask(button.dataset.question)));

const marginThoughts = [
  [5, seriousPrompt],
  [14, thoughtsPrompt],
  [20, seriousPrompt],
  [23, thoughtsPrompt],
  [34, seriousPrompt],
  [43, thoughtsPrompt],
];
const seenThoughts = new Set();
let scrollFrame = 0;
function considerReadingPace() {
  const now = Date.now();
  if (!canInterrupt() || now - lastReaderScroll > 1500) { paceSamples = []; return; }
  const index = paragraphs.findIndex(paragraph => {
    const rect = paragraph.getBoundingClientRect();
    return rect.bottom > innerHeight * .38 && rect.top < innerHeight;
  });
  if (index < 0) { paceSamples = []; return; }
  paceSamples = paceSamples.filter(sample => now - sample.time <= 8000);
  const previous = paceSamples.at(-1);
  if (previous && index < previous.index) paceSamples = [];
  if (!previous || index !== previous.index) paceSamples.push({index, time: now});
  if (paceSamples.length < 4 || now - lastPacePrompt < 45000) return;
  const first = paceSamples[0], elapsed = (now - first.time) / 1000;
  const words = articleText.slice(first.index, index).join(' ').trim().split(/\s+/).length;
  // Forward scrolling through several passages is a cue, not a measure of comprehension.
  if (index - first.index >= 3 && words >= 120 && elapsed > 0 && words / elapsed > 9) {
    if (say(pacePrompts[pacePromptIndex % pacePrompts.length], paragraphs[index])) {
      pacePromptIndex++; lastPacePrompt = now; paceSamples = [];
    }
  }
}
function considerPassage() {
  scrollFrame = 0;
  considerReadingPace();
  if (!canInterrupt() || Date.now() - lastSpoke < 24000) return;
  for (const [index, text] of marginThoughts) {
    if (seenThoughts.has(index) || !paragraphs[index]) continue;
    const rect = paragraphs[index].getBoundingClientRect();
    if (rect.top < innerHeight * .65 && rect.bottom > innerHeight * .25) {
      if (say(text, paragraphs[index])) seenThoughts.add(index);
      break;
    }
  }
}
function activity() {
  lastActivity = Date.now();
  idleCalledOut = false;
  if (!note.hidden && line.textContent === attentionPrompt) dismiss();
}
window.addEventListener('scroll', () => {
  activity();
  if (!scrollFrame) scrollFrame = requestAnimationFrame(considerPassage);
}, {passive: true});
for (const event of ['pointerdown', 'pointermove', 'wheel', 'touchmove', 'keydown']) window.addEventListener(event, activity, {passive: true});
for (const event of ['wheel', 'touchmove', 'keydown']) window.addEventListener(event, input => {
  if (event === 'keydown' && (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(input.key) || input.target?.closest?.('input, textarea, [contenteditable]'))) return;
  lastReaderScroll = Date.now();
}, {passive: true});
window.addEventListener('resize', () => { paceSamples = []; });
setInterval(() => {
  if (!canInterrupt()) return;
  const bounds = document.querySelector('.story-world').getBoundingClientRect();
  if (!idleCalledOut && bounds.bottom > 0 && Date.now() - lastActivity >= 40000 && Date.now() - lastSpoke >= 10000) {
    idleCalledOut = say(attentionPrompt);
  } else if (Date.now() - lastActivity < 30000) considerPassage();
}, 2500);

function leave() {
  paceSamples = []; lastReaderScroll = -Infinity;
  dismiss();
}
function returnToArticle() {
  if (document.hidden || !document.hasFocus()) return;
  activity();
}
document.addEventListener('kineticstart', dismiss);
window.addEventListener('blur', leave);
window.addEventListener('focus', returnToArticle);
document.addEventListener('visibilitychange', () => document.hidden ? leave() : returnToArticle());
updateQuiet();

document.addEventListener('article-inline-question', event => {
  if (event.detail?.target instanceof HTMLElement) ask(event.detail.question, event.detail.target);
});
