const scienceQuotes = [
  { text: "If I have seen further, it is by standing on the shoulders of giants.", author: "Isaac Newton" },
  { text: "What we know is a drop, what we don't know is an ocean.", author: "Isaac Newton" },
  { text: "Nature is pleased with simplicity.", author: "Isaac Newton" },
  { text: "Nothing happens until something moves.", author: "Albert Einstein" },
  { text: "The important thing is not to stop questioning.", author: "Albert Einstein" },
  { text: "Reality is merely an illusion, albeit a very persistent one.", author: "Albert Einstein" },
  { text: "Time is what prevents everything from happening at once.", author: "John Archibald Wheeler" },
  { text: "The universe is not only stranger than we imagine, it is stranger than we can imagine.", author: "J.B.S. Haldane" },
  { text: "The laws of physics are the canvas God laid down on which to paint his masterpiece.", author: "Dan Brown" },
  { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
  { text: "We are a way for the cosmos to know itself.", author: "Carl Sagan" },
  { text: "The cosmos is all that is or ever was or ever will be.", author: "Carl Sagan" },
  { text: "Science is a way of thinking much more than it is a body of knowledge.", author: "Carl Sagan" },
  { text: "Nature uses only the longest threads to weave her patterns.", author: "Richard Feynman" },
  { text: "Everything is made of atoms.", author: "Richard Feynman" },
  { text: "The imagination of nature is far, far greater than the imagination of man.", author: "Richard Feynman" },
  { text: "What I cannot create, I do not understand.", author: "Richard Feynman" },
  { text: "It is not knowledge, but the act of learning, that grants the greatest enjoyment.", author: "Carl Friedrich Gauss" },
  { text: "Equipped with his five senses, man explores the universe around him and calls the adventure Science.", author: "Edwin Hubble" },
  { text: "The good thing about science is that it's true whether or not you believe in it.", author: "Neil deGrasse Tyson" },
  { text: "We are stardust brought to life, then empowered by the universe to figure itself out.", author: "Neil deGrasse Tyson" },
  { text: "Some laws are silent, but never absent.", author: "Anonymous" },
  { text: "Every effect has a cause, and every cause becomes another effect.", author: "Anonymous" },
  { text: "The universe runs on patterns hidden beneath apparent chaos.", author: "Anonymous" },
  { text: "Motion is the language through which the universe tells its story.", author: "Anonymous" },
  { text: "A single event can echo through a system long after the moment has passed.", author: "Anonymous" },
  { text: "The future is shaped by forces already in motion.", author: "Anonymous" },
  { text: "In every collision, the universe keeps perfect accounts.", author: "Anonymous" },
  { text: "Energy never truly disappears; it simply changes its form.", author: "Anonymous" },
  { text: "What appears still is often alive with motion beyond perception.", author: "Anonymous" },
  { text: "The same laws that guide a falling apple govern the motion of galaxies.", author: "Anonymous" },
  { text: "Every moment is the consequence of countless moments before it.", author: "Anonymous" },
  { text: "The universe remembers every push, every pull, and every exchange.", author: "Anonymous" },
  { text: "Order and chaos are partners in the dance of nature.", author: "Anonymous" },
  { text: "The path of discovery begins with noticing what everyone else overlooks.", author: "Anonymous" },
  { text: "The most profound truths are often hidden in the simplest demonstrations.", author: "Anonymous" },
  { text: "What looks like a toy can reveal the architecture of reality.", author: "Anonymous" },
  { text: "The laws of motion are written into every corner of existence.", author: "Anonymous" }
];

const quoteDiv = document.createElement('div');
quoteDiv.style.position = 'absolute';
quoteDiv.style.zIndex = '9999';
quoteDiv.style.bottom = '10px';
quoteDiv.style.left = '50%';
quoteDiv.style.transform = 'translateX(-50%)';
quoteDiv.style.padding = '18px 32px';
quoteDiv.style.color = 'white';
quoteDiv.style.fontFamily = 'Segoe UI, Arial, sans-serif';
quoteDiv.style.fontSize = '1.2rem';
quoteDiv.style.textAlign = 'center';
quoteDiv.style.opacity = '0';
quoteDiv.style.pointerEvents = 'none';
quoteDiv.style.transition = 'opacity 5s cubic-bezier(.4,0,.2,1)';

document.body.appendChild(quoteDiv);

export function showRandomQuote() {
  const { text, author } = scienceQuotes[Math.floor(Math.random() * scienceQuotes.length)];
  quoteDiv.innerHTML = `“${text}”<br><span style="font-size:0.85rem;opacity:0.7;">- ${author}</span>`;
  quoteDiv.style.opacity = '1';
  setTimeout(() => {
    quoteDiv.style.opacity = '0';
  }, 10000);
}