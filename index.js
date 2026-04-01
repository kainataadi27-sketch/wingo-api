const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let results = [];

// ➕ ADD RESULT
app.post("/api/wingo/results", (req, res) => {
  const { number } = req.body;

  const size = number >= 5 ? "Big" : "Small";

  results.unshift({
    number,
    size
  });

  res.json({ success: true });
});

// 📊 GET RESULTS
app.get("/api/wingo/results", (req, res) => {
  res.json({ results });
});

// 🤖 MARKOV + SMART PREDICTION
app.get("/api/wingo/prediction", (req, res) => {

  if (results.length < 10) {
    return res.json({
      prediction: "WAIT",
      confidence: 0,
      signal: "SKIP",
      markov: false,
      votes: { big: 0, small: 0 },
      sequence: ""
    });
  }

  let last = results.slice(0, 15);

  let seq = last.map(x => x.number >= 5 ? "B" : "S");
  let sequence = seq.join("");

  let big = seq.filter(x => x==="B").length;
  let small = seq.filter(x => x==="S").length;

  let lastChar = seq[0];

  // MARKOV
  let transitions = { B:{B:0,S:0}, S:{B:0,S:0} };

  for(let i=0;i<seq.length-1;i++){
    transitions[seq[i]][seq[i+1]]++;
  }

  let markovPrediction;

  if(lastChar==="B"){
    markovPrediction =
      transitions.B.B > transitions.B.S ? "B" : "S";
  } else {
    markovPrediction =
      transitions.S.B > transitions.S.S ? "B" : "S";
  }

  let votePrediction = big > small ? "B" : "S";

  let final = markovPrediction;

  let prediction = final === "B" ? "BIG" : "SMALL";

  let confidence = Math.min(95, (Math.abs(big-small)*8)+40);

  let signal = "SKIP";
  if(confidence >= 80){
    signal = "STRONG_BET";
  } else if(confidence >= 60){
    signal = "BET";
  }

  res.json({
    prediction,
    confidence,
    signal,
    markov: true,
    votes: { big, small },
    sequence
  });
});

app.listen(3000);
