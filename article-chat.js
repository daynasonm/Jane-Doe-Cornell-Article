const answers = {
  "Why does the student feel betrayed?": {
    "text": "The student said she felt betrayed because she expected the police report and the leads she supplied to be handled properly. Students believed an investigation was active, yet people kept going to Chi Phi, including the room at the center of the allegations. My reporting also says information from witnesses and anonymous tips was not forwarded to the local prosecutor for his charging review. Those are reported concerns about the handling, not a finding of guilt.",
    "sources": [
      5,
      14,
      18
    ],
    "citations": []
  },
  "What did police miss?": {
    "text": "Police records reviewed by NBC News showed interviews with multiple witnesses and anonymous tips that were not referred to the local prosecutor for his charging review. District Attorney Matthew Van Houten said the interviews flagged to him involved fraternity members declining to speak on their attorney's advice. He did not answer a follow-up about other interviews and caller tips. He initially found the allegations did not warrant charges because of a lack of criminality, later agreed to reopen his inquiry, and Gov. Kathy Hochul appointed Attorney General Letitia James as special prosecutor. I don't report why the other information was not forwarded. That is a reported referral gap; the article doesn't establish everything police knew or missed.",
    "sources": [
      14,
      15,
      16,
      17
    ],
    "citations": []
  },
  "Was anyone criminally charged?": {
    "text": "None of the seven fraternity brothers named in Doe's lawsuit had been criminally charged as of this report. The civil lawsuit and Cornell's university sanctions are separate from criminal charges. Attorneys for several men denied the allegations.",
    "sources": [
      20,
      21,
      23
    ],
    "citations": []
  },
  "Give me the timeline": {
    "text": "Here's the timeline I can support: Doe alleges the assault happened on the night of Oct. 19–20, 2024. The student said she heard rumors about 24–48 hours later. Doe reported the incident to Cornell police on Nov. 8, and police interviewed the student days afterward. Cornell's statement about its Title IX investigation is dated Sept. 28. The story also reports that the district attorney agreed to reopen his inquiry and Gov. Kathy Hochul appointed Attorney General Letitia James as special prosecutor. This page doesn't provide a publication date or explicit years for every later date.",
    "sources": [
      0,
      1,
      6,
      17,
      21
    ],
    "citations": []
  },
  "What did Cornell say?": {
    "text": "Cornell did not immediately respond to the student's account. President Michael I. Kotlikoff called the allegations deeply disturbing and welcomed an independent review by an outside law firm. Cornell separately said it conducted a thorough, monthslong Title IX investigation and imposed sanctions including expulsions and suspensions.",
    "sources": [
      13,
      21
    ],
    "citations": []
  },
  "What did witnesses tell police?": {
    "text": "The student and a friend first gave authorities a tip after the crime alert. She said Snapchat screenshots helped prompt her to go to police. In her interview, she described fraternity messages about that evening and potential witnesses, and offered secondhand information about drug use and where she believed ketamine was alleged to be kept. NBC News says her details were corroborated by documents it reviewed. Her account includes secondhand information; I don't present it all as direct eyewitness evidence.",
    "sources": [
      6,
      7,
      11
    ],
    "citations": []
  },
  "Who is named in the lawsuit?": {
    "text": "Doe's lawsuit names Cornell, Chi Phi and seven fraternity brothers among the defendants. I do not give the seven men's names. The suit alleges that Doe was plied with alcohol and ketamine and gang-raped at the Chi Phi house on the night of Oct. 19–20, 2024. Attorneys for several men denied the allegations; none of the seven had been criminally charged as of this report.",
    "sources": [
      0,
      1,
      20,
      23
    ],
    "citations": []
  },
  "What did their lawyers say?": {
    "text": "Attorneys for two of the seven men denied to NBC News that they sexually assaulted Doe. An attorney for a third denied the allegations to ABC News. The article says NBC News had not received responses from the five other men; that sentence's count is reported as written. Those statements are denials, not findings about what happened.",
    "sources": [
      23
    ],
    "citations": []
  },
  "Recommend related articles about this case": {
    "text": "If you want to explore this story further, try the reporting below. The timeline follows the case; the explainers explore consent and how bystanders can respond. These are separate sources, rather than facts added to this article.",
    "sources": [],
    "citations": []
  },
  "What sanctions were imposed?": {
    "text": "As of my report, none of the seven fraternity brothers named in the lawsuit had been criminally charged. Cornell said its monthslong Title IX investigation imposed sanctions including expulsions and suspensions. A source described two expulsions, a campus ban for a graduate, and no-contact orders and reflection papers for two others. The page uses the unclear word ‘suspected’ for another two; I can't resolve that wording by guessing. The campus fraternity remained barred. University sanctions and criminal charges are separate outcomes.",
    "sources": [
      20,
      21,
      22
    ],
    "citations": []
  },
  "How did the sorority react?": {
    "text": "Former Tri Delta members described a mix of early support, rumors and shaming. One described later support for Doe alongside frustration and anger about Cornell's handling. Tri Delta's national organization and Cornell chapter said they were committed to supporting women and victims of sexual violence. These are the interviewees' accounts and the organization's statement.",
    "sources": [
      34,
      35,
      36,
      39,
      42,
      43
    ],
    "citations": []
  },
  "Recommend related articles about bystander support": {
    "text": "If you want to explore this story further, try the reporting below. The timeline follows the case; the explainers explore consent and how bystanders can respond. These are separate sources, rather than facts added to this article.",
    "sources": [],
    "citations": []
  },
  "Who wrote this story?": {
    "text": "My reporting is credited to NBC News: Sophie Comeau, Shayna Jacobs, Marlene Lenthang and Abigail Brooks. Pilar Melendez, Kenzi Abou-Sabe and Hayley Walker contributed. The source link is in the article credit.",
    "sources": [],
    "citations": []
  }
};
export const hasPresetQuestion = question => Object.hasOwn(answers, question);
export async function getChatAnswer(question) {
  if (!hasPresetQuestion(question)) throw new Error("Choose one of the questions shown on this page.");
  return answers[question];
}

export function renderChatAnswer(content, answer) {
  content.replaceChildren();
  let position = 0;
  for (const citation of [...(answer.citations || [])].sort((a, b) => a.start - b.start)) {
    let url;
    try { url = new URL(citation.url); } catch { continue; }
    if (url.protocol !== 'https:' || !Number.isInteger(citation.start) || !Number.isInteger(citation.end) || citation.start < position || citation.end > answer.text.length || citation.end <= citation.start) continue;
    content.append(document.createTextNode(answer.text.slice(position, citation.start)));
    const link = document.createElement('a'); link.href = url.href;
    link.target = '_blank'; link.rel = 'noopener noreferrer'; link.className = 'chat-citation';
    link.textContent = `［${citation.title || url.hostname} ↗］`;
    content.append(link); position = citation.end;
  }
  content.append(document.createTextNode(answer.text.slice(position)));
}
