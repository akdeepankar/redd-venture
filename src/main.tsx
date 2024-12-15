import './createPost.js';
import { Devvit, useState } from '@devvit/public-api';

// Defines the messages that are exchanged between Devvit and Web View
type WebViewMessage = 
  | { type: 'setScore'; data: { newScore: number } }
  | { type: 'updateScore'; data: { score: number } }
  | { type: 'setLevel'; data: { newLevel: number } }
  | { type: 'updateLevel'; data: { level: number } }
  | { type: 'initialData'; data: { username: string; currentScore: number; currentLevel: number; gameCompleted: boolean } }
  | { type: 'setGameCompleted'; data: { gameCompleted: string } };

Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
});

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'Redd-Venture',
  height: 'tall',
  render: (context) => {
    // Load username with `useAsync` hook
    const [username] = useState(async () => {
      const currUser = await context.reddit.getCurrentUser();
      return currUser?.username ?? 'anon';
    });

    // Load latest score from Redis with `useAsync` hook
    const [score, setScore] = useState(async () => {
      const redisScore = await context.redis.get(`score_${username}`);
      return Number(redisScore ?? 0);
    });

    // Load best score from Redis with `useAsync` hook
    const [myBestScore, setMyBestScore] = useState(async () => {
      const redisBestScore = await context.redis.get(`bestScore_${username}`);
      return Number(redisBestScore ?? 0);
    });

    const [leaderboardVisible, setLeaderboardVisible] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<string[]>([]);

    const updateLeaderboard = async (bestScore: number) => {
      const key = 'leaderboard';
      console.log('Updating leaderboard...');
      if (username) {
        console.log(`Updating leaderboard: Adding ${username} with score ${bestScore}`);
        await context.redis.zAdd(key, { member: username, score: bestScore });
      } else {
        console.log('Username is missing; cannot update leaderboard.');
      }
    };
    
    const fetchLeaderboard = async () => {
      const key = 'leaderboard';
      try {
        console.log('Fetching leaderboard data...');
        const data = await context.redis.zRange(key, 0, 4);
        if (data.length === 0) {
          console.warn('Leaderboard is empty.');
        } else {
          console.log('Leaderboard data fetched:', data);
        }
        setLeaderboardData(data.map(({ member, score }) => `${member}: ${score}`));
        setLeaderboardVisible(true);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      }
    };
    


    // Load latest level from redis with `useAsync` hook
    // Load latest level from Redis with `useAsync` hook
    const [level, setLevel] = useState(async () => {
      const redisLevel = await context.redis.get(`level_${username}`);
      return Number(redisLevel ?? 1); // Default level is 1
    });

    // Load game completion status from Redis with `useAsync` hook
    const [gameCompleted, setGameCompleted] = useState(async () => {
      const redisGameCompleted = await context.redis.get(`gameCompleted_${username}`);
      return redisGameCompleted ?? 'false'; // Default to 'false' as string
    });

    // Create a reactive state for web view visibility
    const [webviewVisible, setWebviewVisible] = useState(false);

    const isMessageOfType = <T extends WebViewMessage['type']>(msg: WebViewMessage, type: T): msg is Extract<WebViewMessage, { type: T }> => msg.type === type;

    // When the web view invokes `window.parent.postMessage` this function is called
    const onMessage = async (msg: WebViewMessage) => {
      if (isMessageOfType(msg, 'setScore')) {
        const newScore = msg.data.newScore;
        await context.redis.set(`score_${username}`, newScore.toString());
        setScore(newScore);
      } else if (isMessageOfType(msg, 'updateScore')) {
        const newScore = msg.data.score;
        await context.redis.set(`score_${username}`, newScore.toString());
        setScore(newScore);
      } else if (isMessageOfType(msg, 'setLevel')) {
        const newLevel = msg.data.newLevel;
        await context.redis.set(`level_${username}`, newLevel.toString());
        setLevel(newLevel);
      } else if (isMessageOfType(msg, 'updateLevel')) {
        const newLevel = msg.data.level;
        await context.redis.set(`level_${username}`, newLevel.toString());
        setLevel(newLevel);
      } else if (isMessageOfType(msg, 'setGameCompleted')) {
        const gameCompleted = msg.data.gameCompleted;
        await context.redis.set(`gameCompleted_${username}`, gameCompleted);
        setGameCompleted(gameCompleted);
      } else if (isMessageOfType(msg, 'initialData')) {
        const { currentScore, currentLevel, gameCompleted } = msg.data;
        await context.redis.set(`score_${username}`, currentScore.toString());
        await context.redis.set(`level_${username}`, currentLevel.toString());
        await context.redis.set(`gameCompleted_${username}`, gameCompleted.toString());
        setScore(currentScore);
        setLevel(currentLevel);
        setGameCompleted(gameCompleted.toString());
      } else {
        const exhaustiveCheck: never = msg;
        throw new Error(`Unhandled message type: ${msg}`);
      }
    };

    // When the button is clicked, send initial data to web view and show it
    const onShowWebviewClick = () => {
      if (gameCompleted === 'false') {
        setWebviewVisible(true);
        context.ui.webView.postMessage('myWebView', {
          type: 'initialData',
          data: {
            username: username,
            currentScore: score,
            currentLevel: level,
            gameCompleted: 'false', // Initial game completion state
          },
        });
      }
    };

    // Function to reset score and level
    const onResetGameClick = async () => {
      const resetScore = 0;
      const resetLevel = 1;
      const resetGameCompleted = false;

      // Update score and level in redis
      await context.redis.set(`score_${username}`, resetScore.toString());
      await context.redis.set(`level_${username}`, resetLevel.toString());
      await context.redis.set(`gameCompleted_${username}`, resetGameCompleted.toString());

      // Update best score if the current score is greater
      if (score > myBestScore) {
        await context.redis.set(`bestScore_${username}`, score.toString());
        setMyBestScore(score);
        updateLeaderboard(score);
      }

      // Update local state
      setScore(resetScore);
      setLevel(resetLevel);
      setGameCompleted(resetGameCompleted.toString());

      // Send reset data to web view
      context.ui.webView.postMessage('myWebView', {
        type: 'initialData',
        data: {
          username: username,
          currentScore: resetScore,
          currentLevel: resetLevel,
          gameCompleted: resetGameCompleted, // Reset completion flag
        },
      });
    };

    // Render the custom post type
    return (
      <vstack grow padding="small" >
        <vstack
          grow={!webviewVisible}
          height={webviewVisible ? '0%' : '100%'}
          alignment="middle center">
          <spacer />
          <zstack width="100%" height="100%" alignment="center middle">
            <image url="home.png" imageHeight="256px" imageWidth="256px" width="100%" height="100%"  resizeMode='cover'/>
            <vstack alignment="center middle">
               <vstack alignment="center middle" backgroundColor="white" cornerRadius='medium' padding='medium'>
                  <hstack>
                    <text size="xxlarge" color='black'>Redd-Venture 🕵🏻‍♂️</text>
                  </hstack>
                  <spacer />
                  <hstack>
                    <text size="xlarge" color='black'>Hello, </text>
                    <spacer />
                    <text size="xlarge" color='AlienBlue-600' weight="bold">
                      {' '}{username ?? ''}
                    </text>
                  </hstack>
                  <spacer />
                  <hstack>
                  <hstack>
                    <text size="large" color='black'>🪙 Current score:</text>
                    <spacer />
                    <text size="large" color='AlienBlue-600' weight="bold">
                      {' '}{score ?? ''}
                    </text>
                  </hstack>
                  <spacer />
                  <hstack>
                    <text size="large" color='black'>💎 My Best score:</text>
                    <spacer />
                    <text size="large" color='AlienBlue-600' weight="bold">
                      {' '}{myBestScore ?? ''}
                    </text>
                  </hstack>
                  </hstack>
                  <spacer />
                  <hstack>
                  <hstack>
                    <text size="large" color='black'>👾 Current Level:</text>
                    <spacer />
                    <text size="large" color='AlienBlue-600' weight="bold">
                      {' '}{level ?? ''}
                    </text>
                  </hstack>
                  <spacer />
                  <hstack>
                    <text size="large" color='black'>🕹️ Status:</text>
                    <spacer />
                    <text size="large" color='AlienBlue-600' weight="bold">
                      {' '}{gameCompleted === 'true' ? 'Completed' : 'Not Completed'}
                    </text>
                  </hstack>
                  </hstack>
                </vstack>
                <spacer size='medium'/>
                {/* Add the reset button */} 
                <hstack>
                <button onPress={onResetGameClick}>
                🔄 Reset</button>
                <spacer />
                <button 
                  onPress={onShowWebviewClick}
                  disabled={gameCompleted === 'true'}  // Disable button if game is completed
                >
                  {gameCompleted === 'true' ? 'Game Completed' : '▶ Play'}
                </button>
                <spacer />
                <button onPress={fetchLeaderboard}>🏆 Leaderboard</button>
                <spacer />
              
                {leaderboardVisible && ( // Render the Close button only if leaderboardVisible is true
                  <button onPress={() => setLeaderboardVisible(false)}>❌</button>
                )}
              
                </hstack> 

                            {/* Leaderboard Popup */}
                            <spacer size='medium' />
                {leaderboardVisible && (
                  <vstack
                    backgroundColor="white"
                    cornerRadius="medium"
                    padding="medium"
                    height="50%"
                    width="70%"
                    alignment="middle center"
                  >
                  <vstack alignment='middle center' height={30}><text size="large" weight="bold">🥳 LEADERBOARD ~ Top 5 🥳</text>
                    {leaderboardData.map((entry, index) => (
                      <text key={index.toString()}>{index + 1}. {entry}</text>
                    ))}</vstack>
                    
                  </vstack>
                )}

              </vstack>
            </zstack>
        
        </vstack>
        <vstack grow={webviewVisible} height={webviewVisible ? '100%' : '0%'}>
          <vstack border="thick" borderColor="black" height={webviewVisible ? '100%' : '0%'}>
            <webview
              id="myWebView"
              url="page.html"
              onMessage={(msg) => onMessage(msg as WebViewMessage)}
              grow
              height={webviewVisible ? '100%' : '0%'}
            />
          </vstack>
        </vstack>
      </vstack>
    );
  },
});

export default Devvit;
