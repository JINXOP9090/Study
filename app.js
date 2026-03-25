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
        <div className="tracking-widest uppercase truncate">{title}</div>
        <div className="w-12"></div> {/* Spacer */}
      </div>
      {/* Content */}
      <div className="p-4 overflow-y-auto flex-grow text-neon-green relative">
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
  
  const bar = `[${'|'.repeat(filledBlocks)}${'.'.repeat(Math.max(0, emptyBlocks))}]`;
  
  return (
    <div className="font-mono mt-2">
      <div>PROGRESS: {Number(current).toFixed(1)} / {goal} HOURS ({percentage.toFixed(1)}%)</div>
      <div className="text-xl tracking-[0.2em] text-green-400">{bar}</div>
    </div>
  );
};

const calculateBounty = (u) => {
  if (!u) return 10000;
  const base = u.bountyBase !== undefined ? Number(u.bountyBase) : 10000;
  const goal = u.weeklyStudyGoal > 0 ? Number(u.weeklyStudyGoal) : 10;
  const total = Number(u.totalStudyHours || 0);
  const increments = Math.floor((total / goal) * 10);
  return base + (increments * 500);
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
  
  // Settings Mode
  const [showSettings, setShowSettings] = useState(false);
  const [nickname, setNickname] = useState(userProfile?.displayName || "");
  const [goal, setGoal] = useState(userProfile?.weeklyStudyGoal || 10);
  
  // Leaderboard Tab
  const [lbTab, setLbTab] = useState('GLOBAL');

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
      const newSessionRef = db.collection('studySessions').doc();
      dbBatch.set(newSessionRef, {
        userId: user.uid,
        date,
        duration: numDuration,
        topic,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      const userRef = db.collection('users').doc(user.uid);
      dbBatch.update(userRef, {
        totalStudyHours: firebase.firestore.FieldValue.increment(numDuration)
      });
      await dbBatch.commit();
      setDuration("");
      setTopic("");
    } catch (err) {
      alert("ERROR: FAILED TO INJECT RECORD");
    }
    setLoading(false);
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await db.collection('users').doc(user.uid).update({
        displayName: nickname,
        weeklyStudyGoal: Number(goal)
      });
      setShowSettings(false);
    } catch (err) {
      alert("ERROR: FAILED TO UPDATE PROFILE");
    }
    setLoading(false);
  };

  const uniqueCrews = Array.from(new Set(leaderboard.map(u => u.crew).filter(Boolean)));

  const visibleLeaderboard = lbTab === 'GLOBAL' 
    ? leaderboard 
    : leaderboard.filter(u => u.crew === lbTab);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto">
      <div className="space-y-6">
        <TerminalWindow title="TRACKER.EXE" className="h-[450px]">
          <div className="mb-6 flex items-center justify-between border-b border-neon-green/30 pb-4">
            <div className="flex items-center space-x-4">
              <img src={userProfile?.photoURL || 'https://via.placeholder.com/50'} alt="PFP" className="w-16 h-16 border border-neon-green p-1" />
              <div>
                <div className="text-xl glow-text">USER: {userProfile?.displayName || user.email}</div>
                <div className="text-sm opacity-80">CREW: {userProfile?.crew || 'LONE WOLF'}</div>
                <div className="text-sm text-yellow-400 font-bold tracking-widest mt-1">
                  BOUNTY: {calculateBounty(userProfile).toLocaleString()} ฿
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="text-xs border border-neon-green px-2 py-1 hover:bg-neon-green hover:text-black transition-colors">
              {showSettings ? '[RETURN]' : '[SETTINGS]'}
            </button>
          </div>

          {!showSettings ? (
            <>
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
                    placeholder="e.g. 2.5" className="bg-transparent border-b border-neon-green/50 text-neon-green focus:border-neon-green flex-grow uppercase placeholder:text-neon-green/30" />
                </div>
                <div className="flex items-center">
                  <span className="mr-2 text-neon-green">{"> "}TOPIC:</span>
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required
                    placeholder="Quantum Physics" className="bg-transparent border-b border-neon-green/50 text-neon-green focus:border-neon-green flex-grow uppercase placeholder:text-neon-green/30" />
                </div>
                <button type="submit" disabled={loading} className="mt-4 w-full border-2 border-neon-green py-2 hover:bg-neon-green hover:text-black transition-colors font-bold tracking-widest uppercase">
                  {loading ? "EXECUTING..." : "COMMIT_HOURS()"}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleUpdateSettings} className="space-y-4">
               <div>Current Email: <span className="opacity-70">{user.email}</span></div>
               <div className="flex items-center">
                  <span className="mr-2 text-neon-green">{"> "}NICKNAME:</span>
                  <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} required
                    className="bg-transparent border-b border-neon-green/50 text-neon-green focus:border-neon-green flex-grow uppercase" />
               </div>
               <div className="flex items-center">
                  <span className="mr-2 text-neon-green">{"> "}WEEKLY_GOAL:</span>
                  <input type="number" step="1" value={goal} onChange={e => setGoal(e.target.value)} required
                    className="bg-transparent border-b border-neon-green/50 text-neon-green focus:border-neon-green flex-grow uppercase" />
               </div>
               <button type="submit" disabled={loading} className="mt-4 w-full border-2 border-neon-green py-2 hover:bg-neon-green hover:text-black transition-colors font-bold tracking-widest uppercase">
                  {loading ? "SAVING..." : "SAVE_SETTINGS()"}
                </button>
            </form>
          )}
        </TerminalWindow>
      </div>

      <div className="space-y-6">
        <TerminalWindow title="LEADERBOARD.DAT" className="h-[450px]">
          {uniqueCrews.length > 0 && (
            <div className="flex space-x-4 mb-4 border-b border-neon-green/30 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button 
                onClick={() => setLbTab('GLOBAL')} 
                className={`text-sm ${lbTab === 'GLOBAL' ? 'text-white font-bold' : 'text-neon-green/50 hover:text-neon-green'}`}>
                [GLOBAL]
              </button>
              {uniqueCrews.map(c => (
                <button 
                  key={c}
                  onClick={() => setLbTab(c)} 
                  className={`text-sm ${lbTab === c ? 'text-white font-bold' : 'text-neon-green/50 hover:text-neon-green'}`}>
                  [CREW: {c}]
                </button>
              ))}
            </div>
          )}
          <div className="overflow-y-auto max-h-[350px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-neon-green text-neon-green/70">
                  <th className="py-2">RNK</th>
                  <th className="py-2">OPERATIVE</th>
                  <th className="py-2 text-right">BOUNTY</th>
                  <th className="py-2 text-right">HOURS</th>
                </tr>
              </thead>
              <tbody>
                {visibleLeaderboard.map((u, i) => (
                  <tr key={u.id} className="border-b border-neon-green/20 hover:bg-neon-green/10 transition-colors">
                    <td className="py-3 font-bold">{i + 1}</td>
                    <td className="py-3 flex items-center space-x-2">
                      <img src={u.photoURL} className="w-6 h-6 inline border border-neon-green/50 rounded-sm" alt="" />
                      <div className="flex flex-col">
                        <span className={user.uid === u.id ? 'glow-text text-white' : ''}>{u.displayName}</span>
                        {lbTab === 'GLOBAL' && u.crew && <span className="text-[10px] opacity-60">[{u.crew}]</span>}
                      </div>
                    </td>
                    <td className="py-3 text-right font-bold text-yellow-400">{calculateBounty(u).toLocaleString()} ฿</td>
                    <td className="py-3 text-right font-bold tracking-widest text-[#39ff14]">{Number(u.totalStudyHours || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  const [historyModal, setHistoryModal] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  
  useEffect(() => {
    return db.collection('users').onSnapshot(snap => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleUpdateField = async (uid, field, newValue, isNumber) => {
    const val = isNumber ? Number(newValue) : newValue;
    if (isNumber && isNaN(val)) return;
    try {
      await db.collection('users').doc(uid).update({ [field]: val });
    } catch(err) {
      alert("GOD-MODE ERROR: " + err.message);
    }
  };

  const handleDeleteUser = async (uid) => {
    if(!confirm("WARNING: PURGE OPERATIVE ENTIRELY?")) return;
    try {
      const dbBatch = db.batch();
      // Purge sessions
      const sessions = await db.collection('studySessions').where('userId', '==', uid).get();
      sessions.docs.forEach(doc => {
        dbBatch.delete(doc.ref);
      });
      // Purge user
      dbBatch.delete(db.collection('users').doc(uid));
      await dbBatch.commit();
    } catch(err) {
      alert("ERROR DELETING USER");
    }
  };

  const openHistory = async (u) => {
    setHistoryModal(u);
    const snap = await db.collection('studySessions').where('userId', '==', u.id).get();
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    sessions.sort((a,b) => new Date(b.date) - new Date(a.date));
    setUserSessions(sessions);
  };

  const closeHistory = () => {
    setHistoryModal(null);
    setUserSessions([]);
  };

  const handleEditSession = async (sessionId, field, newValue, oldDuration) => {
    try {
      if (field === 'duration') {
        const diff = Number(newValue) - Number(oldDuration);
        if (isNaN(diff)) return;
        const dbBatch = db.batch();
        dbBatch.update(db.collection('studySessions').doc(sessionId), { duration: Number(newValue) });
        dbBatch.update(db.collection('users').doc(historyModal.id), {
          totalStudyHours: firebase.firestore.FieldValue.increment(diff)
        });
        await dbBatch.commit();
      } else {
        await db.collection('studySessions').doc(sessionId).update({ [field]: newValue });
      }
    } catch(e) { alert("ERROR EDITING SESSION"); }
  };

  const handleDeleteSession = async (sessionId, duration) => {
    if(!confirm("DELETE THIS SESSION?")) return;
    try {
      const dbBatch = db.batch();
      dbBatch.delete(db.collection('studySessions').doc(sessionId));
      dbBatch.update(db.collection('users').doc(historyModal.id), {
        totalStudyHours: firebase.firestore.FieldValue.increment(-Number(duration))
      });
      await dbBatch.commit();
      setUserSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch(e) { alert("ERROR"); }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto relative">
      <TerminalWindow title="SUDO_ROOT.EXE" className="min-h-[500px]">
        <h2 className="text-2xl mb-4 text-red-500 font-bold blinking-cursor">WARNING: GOD-MODE ACTIVATED</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-red-500 text-red-500">
                <th className="py-2">EMAIL</th>
                <th>NAME/CREW</th>
                <th>GOAL(H)</th>
                <th>TOTAL(H)</th>
                <th>BASE_BOUNTY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-neon-green/20 hover:bg-red-900/20">
                  <td className="py-2 text-xs truncate max-w-[120px]" title={u.email}>{u.email}</td>
                  <td>
                    <div className="truncate max-w-[100px]">{u.displayName}</div>
                    <input type="text" defaultValue={u.crew || ''} placeholder="Assign Crew"
                      onBlur={e => handleUpdateField(u.id, 'crew', e.target.value.trim().toUpperCase(), false)}
                      className="bg-transparent border-b border-red-500/50 w-24 text-[10px] text-red-400 focus:border-red-500" />
                  </td>
                  <td>
                    <input type="number" defaultValue={u.weeklyStudyGoal} 
                      onBlur={e => handleUpdateField(u.id, 'weeklyStudyGoal', e.target.value, true)}
                      className="bg-transparent border-b border-neon-green/50 w-12 text-center" />
                  </td>
                  <td>
                    <input type="number" defaultValue={u.totalStudyHours} 
                      onBlur={e => handleUpdateField(u.id, 'totalStudyHours', e.target.value, true)}
                      className="bg-transparent border-b border-neon-green/50 w-14 text-center" />
                  </td>
                  <td>
                    <input type="number" step="500" defaultValue={u.bountyBase !== undefined ? u.bountyBase : 10000} 
                      onBlur={e => handleUpdateField(u.id, 'bountyBase', e.target.value, true)}
                      title={`Current Computed Bounty: ${calculateBounty(u).toLocaleString()} ฿`}
                      className="bg-transparent border-b border-yellow-500/50 w-20 text-center text-yellow-500 focus:border-yellow-500" />
                  </td>
                  <td>
                    <button onClick={() => openHistory(u)} className="text-[10px] bg-red-600/20 text-red-500 border border-red-500 px-1 py-1 mx-1 hover:bg-red-500 hover:text-white">
                      [HISTORY]
                    </button>
                    <button onClick={() => handleDeleteUser(u.id)} className="text-[10px] bg-red-600/20 text-red-500 border border-red-500 px-1 py-1 hover:bg-red-500 hover:text-white">
                      [DELETE]
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TerminalWindow>

      {/* HISTORY MODAL OVERLAY */}
      {historyModal && (
        <div className="absolute top-10 left-10 right-10 bottom-10 bg-black/90 border border-red-500 shadow-[0_0_20px_#ff0000] z-50 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6 border-b border-red-500 pb-2">
            <h3 className="text-xl text-red-500">HISTORY: {historyModal.displayName}</h3>
            <button onClick={closeHistory} className="text-red-500 hover:text-white">[CLOSE_OVERRIDE]</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neon-green/30 text-neon-green">
                <th className="py-2">DATE</th>
                <th>TOPIC</th>
                <th>HRS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {userSessions.length === 0 ? <tr><td colSpan="4" className="py-4 text-center">NO DATA FOUND</td></tr> : null}
              {userSessions.map(s => (
                <tr key={s.id} className="border-b border-neon-green/20">
                  <td className="py-2">
                    <input type="date" defaultValue={s.date} 
                      onBlur={e => handleEditSession(s.id, 'date', e.target.value, s.duration)}
                      className="bg-transparent text-sm w-32 border-b border-transparent focus:border-red-500" />
                  </td>
                  <td>
                    <input type="text" defaultValue={s.topic} 
                      onBlur={e => handleEditSession(s.id, 'topic', e.target.value, s.duration)}
                      className="bg-transparent text-sm w-full border-b border-transparent focus:border-red-500" />
                  </td>
                  <td>
                    <input type="number" step="0.1" defaultValue={s.duration} 
                      onBlur={e => handleEditSession(s.id, 'duration', e.target.value, s.duration)}
                      className="bg-transparent text-sm w-12 border-b border-transparent focus:border-red-500 text-right" />
                  </td>
                  <td>
                    <button onClick={() => handleDeleteSession(s.id, s.duration)} className="text-red-500 text-xs px-2 hover:bg-red-500 hover:text-white">
                      [X]
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-xs opacity-70 text-red-400">
            * Changes to HRS automatically adjust the operative's TOTAL HOURS.
          </div>
        </div>
      )}
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
  const [view, setView] = useState('TRACKER'); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          const userRef = db.collection('users').doc(currentUser.uid);
          const docInfo = await userRef.get();
          if (!docInfo.exists) {
            const newProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email,
              email: currentUser.email,
              photoURL: currentUser.photoURL || 'https://via.placeholder.com/50',
              weeklyStudyGoal: 10,
              totalStudyHours: 0,
              crew: null,
              bountyBase: 10000,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await userRef.set(newProfile);
            setUserProfile(newProfile);
          } else {
            setUserProfile(docInfo.data());
          }
          
          userRef.onSnapshot(doc => {
            if (doc.exists) setUserProfile(doc.data());
          });
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error("Auth state error:", err);
        alert("SYSTEM ERROR: Database access denied. Please ensure your Firestore Database is created and rules are set.");
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
      alert("CONNECTION REFUSED");
    }
  };

  const handleLogout = () => auth.signOut();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl blinking-cursor">INITIALIZING SYSTEM...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <header className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center mb-8">
        <div className="text-3xl font-bold glow-text tracking-widest uppercase truncate max-w-[50%]">
          > STUDY_NET_V1.1
        </div>
        
        {user ? (
          <div className="flex space-x-2 md:space-x-4 flex-shrink-0">
            {user.email === ADMIN_EMAIL && (
              <button onClick={() => setView(view === 'ADMIN' ? 'TRACKER' : 'ADMIN')}
                className="text-xs md:text-sm border border-red-500 text-red-500 px-2 md:px-4 py-1 hover:bg-red-500 hover:text-white transition-colors">
                {view === 'ADMIN' ? 'EXIT_ROOT' : 'ENTER_GOD_MODE'}
              </button>
            )}
            <button onClick={handleLogout} className="text-xs md:text-sm border border-neon-green px-2 md:px-4 py-1 hover:bg-neon-green hover:text-black transition-colors">
              LOGOUT
            </button>
          </div>
        ) : null}
      </header>

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
