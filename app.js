const { useState, useEffect, useMemo } = React;

// ---------------------------------------------------------
// FIREBASE CONFIGURATION
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAb3q5B_U3aOIF1Jeq4gB3ScvhYFN2nCOM",
  authDomain: "studyapp-576cb.firebaseapp.com",
  projectId: "studyapp-576cb",
  storageBucket: "studyapp-576cb.firebasestorage.app",
  messagingSenderId: "234636995140",
  appId: "1:234636995140:web:b078b53d44bdfb09acea11",
  measurementId: "G-EYLJ4RVKEK"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// The specific Admin Email possessing god-mode
const ADMIN_EMAIL = "aditya7karale@gmail.com"; 

// ---------------------------------------------------------
// UTILITY COMPONENTS
// ---------------------------------------------------------

const TerminalWindow = ({ title, children, className = "" }) => {
  return (
    <div className={`border-2 border-neon-green bg-terminal-dark bg-opacity-80 shadow-lg shadow-[#39ff14]/20 flex flex-col ${className}`}>
      {/* Title Bar */}
      <div className="border-b-2 border-neon-green flex items-center justify-between px-3 py-1 bg-neon-green text-terminal-dark font-bold">
        <div className="flex space-x-2 items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-black cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 border border-black cursor-pointer"></div>
        </div>
        <div className="tracking-widest uppercase">{title}</div>
        <div className="w-12"></div> {/* Spacer for centering */}
      </div>
      {/* Content */}
      <div className="p-4 overflow-y-auto flex-grow text-neon-green">
        {children}
      </div>
    </div>
  );
};

const AsciiProgressBar = ({ current, goal }) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const totalBlocks = 20;
  const filledBlocks = Math.floor((percentage / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  
  const bar = `[${'|'.repeat(filledBlocks)}${'.'.repeat(emptyBlocks)}]`;
  
  return (
    <div className="font-mono mt-2">
      <div>PROGRESS: {current} / {goal} HOURS ({percentage.toFixed(1)}%)</div>
      <div className="text-xl tracking-[0.2em] text-green-400">{bar}</div>
    </div>
  );
};

// ---------------------------------------------------------
// MAIN DASHBOARD COMPONENT
// ---------------------------------------------------------
const Dashboard = ({ user, userProfile }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState("");
  const [topic, setTopic] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Leaderboard
  useEffect(() => {
    const unsubscribe = db.collection('users')
      .orderBy('totalStudyHours', 'desc')
      .onSnapshot((snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaderboard(users);
      });
    return () => unsubscribe();
  }, []);

  const handleLogHours = async (e) => {
    e.preventDefault();
    if (!duration || isNaN(duration) || Number(duration) <= 0 || !topic) return;

    setLoading(true);
    const numDuration = Number(duration);
    
    try {
      const dbBatch = db.batch();
      
      // 1. Create Session Document
      const newSessionRef = db.collection('studySessions').doc();
      dbBatch.set(newSessionRef, {
        userId: user.uid,
        date,
        duration: numDuration,
        topic,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 2. Increment user's total hours
      const userRef = db.collection('users').doc(user.uid);
      dbBatch.update(userRef, {
        totalStudyHours: firebase.firestore.FieldValue.increment(numDuration)
      });

      await dbBatch.commit();
      
      setDuration("");
      setTopic("");
      // Add a small terminal console log flash effect here if desired
    } catch (err) {
      console.error("Error logging hours:", err);
      alert("ERROR: FAILED TO INJECT RECORD");
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Personal Stats & Log Window */}
        <TerminalWindow title="TRACKER.EXE" className="h-[450px]">
          <div className="mb-6 flex items-center space-x-4 border-b border-neon-green/30 pb-4">
            <img src={userProfile?.photoURL || 'https://via.placeholder.com/50'} alt="PFP" className="w-16 h-16 border border-neon-green p-1" />
            <div>
              <div className="text-xl glow-text">USER: {userProfile?.displayName || user.email}</div>
              <div className="text-sm opacity-80">ACCESS LEVEL: {user.email === ADMIN_EMAIL ? 'SUDO ROOT' : 'STANDARD'}</div>
            </div>
          </div>

          <AsciiProgressBar current={userProfile?.totalStudyHours || 0} goal={userProfile?.weeklyStudyGoal || 10} />

          <form onSubmit={handleLogHours} className="mt-8 space-y-4">
            <div className="flex items-center">
              <span className="mr-2 text-neon-green">{"> "}DATE:</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="bg-transparent border-b border-neon-green/50 text-neon-green focus:border-neon-green flex-grow uppercase" />
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-neon-green">{"> "}DURATION (HRS):</span>
              <input type="number" step="0.1" value={duration} onChange={e => setDuration(e.target.value)} required
                placeholder="e.g. 2.5"
                className="bg-transparent border-b border-neon-green/50 text-neon-green focus:border-neon-green flex-grow uppercase placeholder:text-neon-green/30" />
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-neon-green">{"> "}TOPIC:</span>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required
                placeholder="Quantum Physics"
                className="bg-transparent border-b border-neon-green/50 text-neon-green focus:border-neon-green flex-grow uppercase placeholder:text-neon-green/30" />
            </div>
            <button type="submit" disabled={loading} 
              className="mt-4 w-full border-2 border-neon-green py-2 hover:bg-neon-green hover:text-black transition-colors font-bold tracking-widest uppercase">
              {loading ? "EXECUTING..." : "COMMIT_HOURS()"}
            </button>
          </form>
        </TerminalWindow>
      </div>

      <div className="space-y-6">
        {/* Leaderboard Window */}
        <TerminalWindow title="LEADERBOARD.DAT" className="h-[450px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-neon-green text-neon-green/70">
                <th className="py-2">RNK</th>
                <th className="py-2">OPERATIVE</th>
                <th className="py-2 text-right">HOURS</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((u, i) => (
                <tr key={u.id} className="border-b border-neon-green/20 hover:bg-neon-green/10 transition-colors">
                  <td className="py-3 font-bold">{i + 1}</td>
                  <td className="py-3 flexItems-center space-x-2">
                    <img src={u.photoURL} className="w-6 h-6 inline border border-neon-green/50" alt="" />
                    <span className={user.uid === u.id ? 'glow-text text-white' : ''}>{u.displayName}</span>
                  </td>
                  <td className="py-3 text-right font-bold tracking-widest text-[#39ff14]">{Number(u.totalStudyHours || 0).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TerminalWindow>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// ADMIN PANEL COMPONENT
// ---------------------------------------------------------
const AdminPanel = ({ user }) => {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    return db.collection('users').onSnapshot(snap => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleUpdateUser = async (uid, field, newValue) => {
    const val = Number(newValue);
    if (isNaN(val)) return;
    try {
      await db.collection('users').doc(uid).update({ [field]: val });
    } catch(err) {
      alert("GOD-MODE ERROR: " + err.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <TerminalWindow title="SUDO_ROOT.EXE" className="min-h-[500px]">
        <h2 className="text-2xl mb-4 text-red-500 font-bold blinking-cursor">WARNING: GOD-MODE ACTIVATED</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-red-500 text-red-500">
                <th className="py-2">ID/EMAIL</th>
                <th>NAME</th>
                <th>GOAL (HRS)</th>
                <th>TOTAL (HRS)</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-neon-green/20 hover:bg-red-900/20">
                  <td className="py-2 text-sm max-w-[150px] truncate" title={u.email}>{u.email}</td>
                  <td>{u.displayName}</td>
                  <td>
                    <input type="number" defaultValue={u.weeklyStudyGoal} 
                      onBlur={e => handleUpdateUser(u.id, 'weeklyStudyGoal', e.target.value)}
                      className="bg-transparent border-b border-neon-green/50 w-20 text-center" />
                  </td>
                  <td>
                    <input type="number" defaultValue={u.totalStudyHours} 
                      onBlur={e => handleUpdateUser(u.id, 'totalStudyHours', e.target.value)}
                      className="bg-transparent border-b border-neon-green/50 w-20 text-center" />
                  </td>
                  <td>
                    <button className="text-xs bg-red-600/20 text-red-500 border border-red-500 px-2 py-1 mx-1 hover:bg-red-500 hover:text-white">
                      [EDIT_HISTORY]
                    </button>
                    <button className="text-xs bg-red-600/20 text-red-500 border border-red-500 px-2 py-1 mx-1 hover:bg-red-500 hover:text-white">
                      [DELETE]
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TerminalWindow>
    </div>
  );
}

// ---------------------------------------------------------
// MAIN APP COMPONENT
// ---------------------------------------------------------
function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('TRACKER'); // 'TRACKER' | 'ADMIN'

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          // Initialize or fetch user profile
          const userRef = db.collection('users').doc(currentUser.uid);
          const docInfo = await userRef.get();
          if (!docInfo.exists) {
            // New User Setup
            const newProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email,
              email: currentUser.email,
              photoURL: currentUser.photoURL || 'https://via.placeholder.com/50',
              weeklyStudyGoal: 10,
              totalStudyHours: 0,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await userRef.set(newProfile);
            setUserProfile(newProfile);
          } else {
            setUserProfile(docInfo.data());
          }
          
          // Listen to profile changes
          userRef.onSnapshot(doc => {
            if (doc.exists) setUserProfile(doc.data());
          });
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error("Auth state error:", err);
        alert("SYSTEM ERROR: Database access denied or unavailable. Please ensure your Firestore Database is created and rules are set.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch(err) {
      console.error(err);
      alert("CONNECTION REFUSED");
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl blinking-cursor">INITIALIZING SYSTEM...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* GLOBAL HEADER */}
      <header className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center mb-8">
        <div className="text-3xl font-bold glow-text tracking-widest uppercase">
          > STUDY_NET_V1.0
        </div>
        
        {user ? (
          <div className="flex space-x-4">
            {user.email === ADMIN_EMAIL && (
              <button onClick={() => setView(view === 'ADMIN' ? 'TRACKER' : 'ADMIN')}
                className="border border-red-500 text-red-500 px-4 py-1 hover:bg-red-500 hover:text-white transition-colors">
                {view === 'ADMIN' ? 'EXIT_ROOT' : 'ENTER_GOD_MODE'}
              </button>
            )}
            <button onClick={handleLogout} className="border border-neon-green px-4 py-1 hover:bg-neon-green hover:text-black transition-colors">
              LOGOUT
            </button>
          </div>
        ) : null}
      </header>

      {/* MAIN CONTENT AREA */}
      {!user ? (
        <div className="flex items-center justify-center mt-20">
          <TerminalWindow title="AUTH_GATEWAY.EXE" className="w-[400px]">
             <div className="text-center space-y-8 py-8">
               <div className="text-xl">ACCESS RESTRICTED</div>
               <p className="text-sm opacity-80">PLEASE IDENTIFY YOURSELF TO CONTINUE.</p>
               <button onClick={handleLogin} className="w-full border-2 border-neon-green py-3 font-bold text-lg hover:bg-neon-green hover:text-black transition-colors glow-border">
                 > INITIALIZE GOOGLE AUTH
               </button>
             </div>
          </TerminalWindow>
        </div>
      ) : (
        view === 'ADMIN' && user.email === ADMIN_EMAIL ? (
          <AdminPanel user={user} />
        ) : (
          <Dashboard user={user} userProfile={userProfile} />
        )
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
