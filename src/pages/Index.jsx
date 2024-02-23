import React, { useState, useEffect } from "react";
import { Box, Button, Flex, Heading, Text, VStack, HStack, useToast, Image } from "@chakra-ui/react";
import { FaUser, FaRobot, FaPlay, FaPause, FaCaretUp, FaAngleDoubleUp } from "react-icons/fa";

// Helper functions to simulate a deck of cards and the game logic
const suits = ["♠", "♣", "♥", "♦"];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

// Generate a new shuffled deck
function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, value: getValue(rank) });
    }
  }
  return shuffle(deck);
}

// Shuffle the deck
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Get the value of a card
function getValue(rank) {
  if (["J", "Q", "K"].includes(rank)) {
    return 10;
  }
  if (rank === "A") {
    return 11; // Aces can also be 1, but we'll handle that in the getTotal function
  }
  return parseInt(rank);
}

// Get the total value of the hand
function getTotal(hand) {
  let total = hand.reduce((acc, card) => acc + card.value, 0);
  let aces = hand.filter((card) => card.rank === "A").length;

  // Adjust for aces
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

// Check if the hand is a blackjack
function isBlackjack(hand) {
  return hand.length === 2 && getTotal(hand) === 21;
}

// Render a single card
const Card = ({ card }) => (
  <Box border="1px" borderColor="gray.200" borderRadius="md" w="60px" h="90px" display="flex" alignItems="center" justifyContent="center" bg="white" boxShadow="md" mr="2">
    <Text fontSize="xl">
      {card.rank}
      {card.suit}
    </Text>
  </Box>
);

const Index = () => {
  const [deck, setDeck] = useState(createDeck());
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerScore, setPlayerScore] = useState(1000); // Player starts with 1000 score/money
  const [dealerScore, setDealerScore] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const toast = useToast();

  // Deal initial cards
  useEffect(() => {
    initialDeal();
  }, []);

  // Deal two cards to player and dealer
  const initialDeal = () => {
    const newDeck = createDeck();
    setPlayerHand([newDeck.pop(), newDeck.pop()]);
    setDealerHand([newDeck.pop(), newDeck.pop()]);
    setDeck(newDeck);
    setIsPlayerTurn(true);
    setIsGameOver(false);
  };

  // Player hits for a new card
  const handleHit = () => {
    if (!isPlayerTurn) return;
    const newDeck = [...deck];
    const newPlayerHand = [...playerHand, newDeck.pop()];
    setPlayerHand(newPlayerHand);
    setDeck(newDeck);
    if (getTotal(newPlayerHand) >= 21) {
      setIsPlayerTurn(false);
      setTimeout(() => {
        handleDealerTurn();
      }, 1000);
    }
  };

  // Dealer's turn
  const handleDealerTurn = () => {
    let newDealerHand = [...dealerHand];

    while (getTotal(newDealerHand) < 17) {
      newDealerHand.push(deck.pop());
    }

    setDealerHand(newDealerHand);
    setIsGameOver(true);
    determineWinner(newDealerHand);
  };

  // Update determineWinner to handle score changes
  // Remove the previous determineWinner declaration

  // Player stands and ends their turn
  const handleStand = () => {
    setIsPlayerTurn(false);
    setTimeout(() => {
      handleDealerTurn();
    }, 1000);
  };

  const handleDouble = () => {
    if (!isPlayerTurn || playerHand.length !== 2) return;
    const newDeck = [...deck];
    const newPlayerHand = [...playerHand, newDeck.pop()];
    setPlayerHand(newPlayerHand);
    setDeck(newDeck);
    setCurrentBet(currentBet * 2);
    setPlayerScore((prevScore) => prevScore - currentBet);
    setIsPlayerTurn(false);
    setTimeout(() => {
      handleDealerTurn();
    }, 1000);
  };

  const handleBet = (betAmount) => {
    if (betAmount > playerScore || currentBet > 0) {
      toast({
        title: "Cannot place bet now!",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setCurrentBet(betAmount);
    setPlayerScore((prevScore) => prevScore - betAmount);
    initialDeal();
  };

  // Restart the game and reset the bet without updating the scores again
  const handleNextHand = () => {
    if (isGameOver) {
      setCurrentBet(0); // Reset the bet
      initialDeal(); // Start the next hand
    }
  };

  // Update determineWinner to handle score changes
  const determineWinner = (finalDealerHand) => {
    const playerTotal = getTotal(playerHand);
    const dealerTotal = getTotal(finalDealerHand);
    let winner = null;

    if (playerTotal > 21) {
      // Player busted, dealer wins
      setDealerScore(dealerScore + currentBet);
      winner = "dealer";
    } else if (dealerTotal > 21) {
      // Dealer busted, player wins
      setPlayerScore(playerScore + currentBet * 2);
      winner = "player";
    } else if (playerTotal > dealerTotal) {
      // Player has higher score, player wins
      setPlayerScore(playerScore + currentBet * 2);
      winner = "player";
    } else if (dealerTotal > playerTotal) {
      // Dealer has higher score, dealer wins
      setDealerScore(dealerScore + currentBet);
      winner = "dealer";
    }

    if (winner) {
      toast({
        title: `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`,
        status: winner === "player" ? "success" : "error",
        duration: 2000,
        isClosable: true,
      });
    } else {
      setPlayerScore((prevScore) => prevScore + currentBet);
      toast({
        title: "Push!",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={8} p={8}>
      <Heading as="h1" size="xl" textAlign="center">
        Blackjack
      </Heading>
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Your Score: ${playerScore}
      </Text>
      <VStack spacing={4} mb={4}>
        <HStack>
          <Button onClick={() => handleBet(10)} isDisabled={currentBet > 0 || isGameOver}>
            Bet $10
          </Button>
          <Button onClick={() => handleBet(50)} isDisabled={currentBet > 0 || isGameOver}>
            Bet $50
          </Button>
          <Button onClick={() => handleBet(100)} isDisabled={currentBet > 0 || isGameOver}>
            Bet $100
          </Button>
        </HStack>
        <HStack>
          <Text fontSize="xl">Your Bet: ${currentBet}</Text>
        </HStack>
      </VStack>
      <HStack justifyContent="center" spacing={4} mb={4}>
        <Flex alignItems="center">
          <FaUser size="2x" />
          <Text fontSize="xl" ml={2}>
            Player
          </Text>
        </Flex>
        <Flex alignItems="center">
          <FaRobot size="2x" />
          <Text fontSize="xl" ml={2}>
            Dealer
          </Text>
        </Flex>
      </HStack>
      {currentBet > 0 && (
        <HStack justifyContent="center" spacing={4}>
          <VStack>
            <HStack>
              {playerHand.map((card, index) => (
                <Card key={index} card={card} />
              ))}
            </HStack>
            <Text fontSize="xl">Total: {getTotal(playerHand)}</Text>
          </VStack>
          <VStack>
            <HStack>
              {dealerHand.map((card, index) => {
                if (isPlayerTurn && index === 1) {
                  return (
                    <Box key={index} border="1px" borderColor="gray.200" borderRadius="md" w="60px" h="90px" display="flex" alignItems="center" justifyContent="center" bg="gray.300" boxShadow="md" mr="2">
                      <Text fontSize="xl">?</Text>
                    </Box>
                  );
                }
                return <Card key={index} card={card} />;
              })}
            </HStack>
            {!isGameOver && !isPlayerTurn && <Text fontSize="xl">Total: {getTotal(dealerHand)}</Text>}
            {!isGameOver && isPlayerTurn && <Text fontSize="xl">Total: ??</Text>}
            {isGameOver && <Text fontSize="xl">Total: {getTotal(dealerHand)}</Text>}
          </VStack>
        </HStack>
      )}
      <HStack spacing={4} justifyContent="center">
        <Button leftIcon={<FaCaretUp size="1.5em" />} colorScheme="green" onClick={handleHit} isDisabled={!isPlayerTurn || isGameOver || currentBet === 0 || playerHand.length > 2}>
          Hit
        </Button>
        <Button leftIcon={<FaPause size="1.5em" />} colorScheme="orange" onClick={handleStand} isDisabled={!isPlayerTurn || isGameOver || currentBet === 0}>
          Stand
        </Button>
        <Button leftIcon={<FaAngleDoubleUp size="1.5em" />} colorScheme="purple" onClick={handleDouble} isDisabled={!isPlayerTurn || isGameOver || currentBet === 0 || playerHand.length > 2}>
          Double
        </Button>
        <Button leftIcon={<FaPlay size="1.5em" />} colorScheme="teal" onClick={handleNextHand} isDisabled={!isGameOver}>
          Next Hand
        </Button>
      </HStack>

      {isBlackjack(playerHand) && !isGameOver && (
        <Text fontSize="2xl" color="green.500">
          Blackjack! You win double your bet!
        </Text>
      )}
    </VStack>
  );
};

export default Index;
