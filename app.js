const { useState, useEffect, useMemo, useCallback } = React;

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

const ADMIN_EMAIL = "aditya7karale@gmail.com"; 

// Devil Fruit Registry
const FRUIT_REGISTRY = [
  { id: 'GUM-GUM', name: 'Gum-Gum Fruit', desc: '+600 ฿ per 10% milestone (instead of 500)', icon: '🍖' },
  { id: 'CHOP-CHOP', name: 'Chop-Chop Fruit', desc: '+250 ฿ every 5% milestone', icon: '🔪' },
  { id: 'GLINT-GLINT', name: 'Glint-Glint Fruit', desc: '1.1x multiplier on logged hours', icon: '✨' },
  { id: 'HUMAN-HUMAN', name: 'Human-Human Fruit', desc: '+50 ฿ attendance bonus per commit', icon: '🧠' },
  { id: 'SMOOTH-SMOOTH', name: 'Smooth-Smooth Fruit', desc: 'Bounty can never decrease', icon: '🛡️' },
];

// ---------------------------------------------------------
// UTILITY: Y2K WINDOW COMPONENT (Functional Controls)
// ---------------------------------------------------------
const Y2KWindow = ({ title, children, className = "", danger = false, windowId, windowState, onMinimize, onMaximize, onClose, style }) => {
  const isMinimized = windowState === 'minimized';
  const isMaximized = windowState === 'maximized';
  const isClosed = windowState === 'closed';

  if (isClosed) return null;

  return (
    <div className={`y2k-window ${isMaximized ? 'y2k-window-maximized' : ''} ${className}`} style={style}>
      <div className={`y2k-titlebar ${danger ? 'admin-border' : ''}`} 
        style={danger ? {background: 'linear-gradient(90deg, #f0b0b0, #e0a0a0, #d8a0b0)'} : {}}
        onDoubleClick={onMaximize}>
        <span className={`y2k-titlebar-text ${danger ? 'admin-header' : ''}`}>{title}</span>
        <div className="y2k-titlebar-controls">
          {onMinimize && <div className="y2k-ctrl-btn" onClick={onMinimize} title="Minimize">_</div>}
          {onMaximize && <div className="y2k-ctrl-btn" onClick={onMaximize} title="Maximize">□</div>}
          {onClose && <div className="y2k-ctrl-btn y2k-ctrl-close" onClick={onClose} title="Close">✕</div>}
        </div>
      </div>
      {!isMinimized && (
        <div className="y2k-window-body">
          {children}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------
// SPARKLE BACKGROUND
// ---------------------------------------------------------
const SparkleBackground = () => {
  const sparkles = [
    { type: 'cross', top: '8%', left: '5%', size: 30, delay: '0s' },
    { type: 'diamond', top: '15%', left: '60%', size: 18, delay: '1s' },
    { type: 'cross', top: '30%', left: '85%', size: 22, delay: '0.5s' },
    { type: 'diamond', top: '50%', left: '3%', size: 16, delay: '2s' },
    { type: 'cross', top: '65%', left: '45%', size: 26, delay: '1.5s' },
    { type: 'diamond', top: '75%', left: '90%', size: 20, delay: '0.8s' },
    { type: 'cross', top: '85%', left: '20%', size: 18, delay: '2.5s' },
    { type: 'diamond', top: '40%', left: '70%', size: 14, delay: '3s' },
    { type: 'cross', top: '55%', left: '15%', size: 20, delay: '1.2s' },
  ];
  return (
    <div className="y2k-bg-sparkles">
      {sparkles.map((s, i) => (
        <div key={i}
          className={s.type === 'cross' ? 'sparkle' : 'sparkle-diamond'}
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------
// DESKTOP ICONS (Clickable Launchers)
// ---------------------------------------------------------
const DesktopIcons = ({ onOpen }) => (
  <div className="desktop-icons">
    <div className="desktop-icon" onClick={() => onOpen('leaderboard')} title="Open Leaderboard">
      <div className="folder-icon folder-blue">
        <span className="folder-emoji">📊</span>
      </div>
      <div className="desktop-icon-label">Leaderboard</div>
    </div>
    <div className="desktop-icon" onClick={() => onOpen('profile')} title="Open Profile">
      <div className="folder-icon">
        <span className="folder-emoji">👤</span>
      </div>
      <div className="desktop-icon-label">My Profile</div>
    </div>
    <div className="desktop-icon" onClick={() => onOpen('fruits')} title="Devil Fruits">
      <div className="folder-icon folder-yellow">
        <span className="folder-emoji">🍇</span>
      </div>
      <div className="desktop-icon-label">Devil Fruits</div>
    </div>
  </div>
);

// ---------------------------------------------------------
// DEVIL FRUITS INFO WINDOW
// ---------------------------------------------------------
const DevilFruitsWindow = ({ userProfile }) => {
  return (
    <div className="space-y-3">
      <div className="text-xs mb-2" style={{color:'#8a7aaa'}}>
        Your Fruit: <strong>{userProfile?.fruit ? `${FRUIT_REGISTRY.find(f=>f.id===userProfile.fruit)?.icon || ''} ${userProfile.fruit}` : 'None assigned'}</strong>
      </div>
      {FRUIT_REGISTRY.map(f => (
        <div key={f.id} className="flex items-start gap-3 p-2" style={{
          border: userProfile?.fruit === f.id ? '2px solid #c0a0e0' : '1px solid #e0d8f0',
          background: userProfile?.fruit === f.id ? 'rgba(192, 160, 224, 0.1)' : 'transparent'
        }}>
          <div className="text-2xl">{f.icon}</div>
          <div>
            <div className="font-bold text-sm">{f.name} {userProfile?.fruit === f.id && <span className="fruit-tag">EQUIPPED</span>}</div>
            <div className="text-xs" style={{color:'#8a7aaa'}}>{f.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------
// TASKBAR
// ---------------------------------------------------------
const Taskbar = ({ user, onLogout, onToggleAdmin, isAdmin, view, windowStates, onRestoreWindow }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const minimizedWindows = Object.entries(windowStates).filter(([k, v]) => v === 'minimized' || v === 'closed');

  return (
    <div className="y2k-taskbar">
      <div className="y2k-start-btn">☆ Start</div>
      
      {/* Taskbar buttons for minimized/closed windows */}
      {minimizedWindows.map(([id, state]) => (
        <button key={id} onClick={() => onRestoreWindow(id)} className="y2k-taskbar-item" title={`Restore ${id}`}>
          {id === 'tracker' && '📝 Tracker'}
          {id === 'leaderboard' && '📊 Leaderboard'}
          {id === 'profile' && '👤 Profile'}
          {id === 'fruits' && '🍇 Fruits'}
        </button>
      ))}

      {user && isAdmin && (
        <button onClick={onToggleAdmin} className="y2k-btn" style={{padding:'2px 8px', fontSize:'11px'}}>
          {view === 'ADMIN' ? '✕ Exit Root' : '⚡ God Mode'}
        </button>
      )}
      {user && (
        <button onClick={onLogout} className="y2k-btn" style={{padding:'2px 8px', fontSize:'11px'}}>
          Logout
        </button>
      )}
      <div className="y2k-taskbar-clock">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// PROGRESS BAR (Y2K Loading Style)
// ---------------------------------------------------------
const ProgressBar = ({ current, goal }) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  return (
    <div className="my-3">
      <div className="flex justify-between text-xs mb-1" style={{color:'#6a6a8a'}}>
        <span>Weekly Progress: {Number(current).toFixed(1)} / {goal.toFixed(1)} hrs</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="y2k-progress-track">
        <div className="y2k-progress-fill" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// BOUNTY CALCULATOR
// ---------------------------------------------------------
const calculateBounty = (u) => {
  if (!u) return 10000;
  // Admin bounty override takes precedence over everything
  if (u.bountyOverride !== undefined && u.bountyOverride !== null) {
    return Number(u.bountyOverride);
  }
  const base = u.bountyBase !== undefined ? Number(u.bountyBase) : 10000;
  const dailyGoal = u.dailyStudyGoal > 0 ? Number(u.dailyStudyGoal) : (u.weeklyStudyGoal > 0 ? Number(u.weeklyStudyGoal) / 7 : 2);
  const total = Number(u.totalStudyHours || 0);
  const percentageCompleted = total / dailyGoal;
  let bountyAdd = 0;
  if (u.fruit === 'GUM-GUM') {
    bountyAdd = Math.floor(percentageCompleted * 10) * 600;
  } else if (u.fruit === 'CHOP-CHOP') {
    bountyAdd = Math.floor(percentageCompleted * 20) * 250;
  } else {
    bountyAdd = Math.floor(percentageCompleted * 10) * 500;
  }
  let finalBounty = base + bountyAdd;
  // SMOOTH-SMOOTH: bounty can never decrease — use stored maxBounty
  if (u.fruit === 'SMOOTH-SMOOTH') {
    const storedMax = Number(u.maxBounty || 0);
    finalBounty = Math.max(storedMax, finalBounty);
  }
  return finalBounty;
};

// ---------------------------------------------------------
// MAIN DASHBOARD COMPONENT
// ---------------------------------------------------------
const Dashboard = ({ user, userProfile, windowStates, setWindowState }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [rawUsers, setRawUsers] = useState([]);
  const [rawSessions, setRawSessions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const [showSettings, setShowSettings] = useState(false);
  const [nickname, setNickname] = useState(userProfile?.displayName || "");
  const [goal, setGoal] = useState(userProfile?.dailyStudyGoal || (userProfile?.weeklyStudyGoal ? userProfile.weeklyStudyGoal / 7 : 2));
  
  const [lbTab, setLbTab] = useState('GLOBAL');

  useEffect(() => {
    const unsubU = db.collection('users').onSnapshot(snap => setRawUsers(snap.docs.map(d => ({id:d.id, ...d.data()}))));
    const today = new Date();
    const day = today.getDay() || 7; 
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + 1);
    const startOfWeekStr = monday.toISOString().split('T')[0];
    const unsubS = db.collection('studySessions').where('date', '>=', startOfWeekStr).onSnapshot(snap => setRawSessions(snap.docs.map(d => d.data())));
    return () => { unsubU(); unsubS(); };
  }, []);

  useEffect(() => {
    const weeklyTotals = {};
    rawSessions.forEach(s => { weeklyTotals[s.userId] = (weeklyTotals[s.userId] || 0) + s.duration; });
    const users = rawUsers.map(data => {
      const dailyGoal = data.dailyStudyGoal > 0 ? data.dailyStudyGoal : (data.weeklyStudyGoal ? data.weeklyStudyGoal / 7 : 2);
      const wHours = weeklyTotals[data.id] || 0;
      return { ...data, dailyGoal, weeklyHours: wHours, goalPercentage: (wHours / (dailyGoal * 7)) * 100 };
    });
    users.sort((a,b) => b.goalPercentage - a.goalPercentage);
    setLeaderboard(users);
  }, [rawUsers, rawSessions]);

  const handleLogHours = async (e) => {
    e.preventDefault();
    if (!duration || isNaN(duration) || Number(duration) <= 0 || !topic) return;
    setLoading(true);
    let numDuration = Number(duration);
    if (userProfile?.fruit === 'GLINT-GLINT') { numDuration = numDuration * 1.1; }
    try {
      const dbBatch = db.batch();
      const newSessionRef = db.collection('studySessions').doc();
      dbBatch.set(newSessionRef, { userId: user.uid, date, duration: numDuration, topic, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      const userRef = db.collection('users').doc(user.uid);
      const updates = { totalStudyHours: firebase.firestore.FieldValue.increment(numDuration) };
      if (userProfile?.fruit === 'HUMAN-HUMAN') { updates.bountyBase = firebase.firestore.FieldValue.increment(50); }
      dbBatch.update(userRef, updates);
      await dbBatch.commit();
      // After commit, update maxBounty for SMOOTH-SMOOTH users
      if (userProfile?.fruit === 'SMOOTH-SMOOTH') {
        const freshDoc = await userRef.get();
        const freshData = freshDoc.data();
        const computedBounty = calculateBounty({ ...freshData, bountyOverride: null });
        const storedMax = Number(freshData.maxBounty || 0);
        if (computedBounty > storedMax) {
          await userRef.update({ maxBounty: computedBounty });
        }
      }
      setDuration(""); setTopic("");
    } catch (err) { alert("System error :( Failed to commit."); }
    setLoading(false);
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await db.collection('users').doc(user.uid).update({ displayName: nickname, dailyStudyGoal: Number(goal) });
      setShowSettings(false);
    } catch (err) { alert("System error :( Failed to update."); }
    setLoading(false);
  };

  const uniqueCrews = Array.from(new Set(leaderboard.map(u => u.crew).filter(Boolean)));
  const visibleLeaderboard = lbTab === 'GLOBAL' ? leaderboard : leaderboard.filter(u => u.crew === lbTab);
  const me = leaderboard.find(u => u.id === user.uid);
  const myWeeklyHours = me?.weeklyHours || 0;
  const myDailyGoal = me?.dailyGoal || 2;

  const mkWindowCtrl = (id) => ({
    windowState: windowStates[id] || 'normal',
    onMinimize: () => setWindowState(id, 'minimized'),
    onMaximize: () => setWindowState(id, windowStates[id] === 'maximized' ? 'normal' : 'maximized'),
    onClose: () => setWindowState(id, 'closed'),
  });

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TRACKER WINDOW */}
        <Y2KWindow title="📝 TRACKER.EXE" {...mkWindowCtrl('tracker')} className={windowStates.tracker === 'maximized' ? 'md:col-span-2' : ''}>
          <div className="flex items-center justify-between border-b pb-3 mb-3" style={{borderColor:'#e0d0f0'}}>
            <div className="flex items-center gap-3">
              <img src={userProfile?.photoURL || 'https://via.placeholder.com/50'} alt="PFP" className="w-14 h-14 border-2 rounded-sm" style={{borderColor: '#c0a0e0'}} />
              <div>
                <div className="font-bold text-base">{userProfile?.displayName || 'Operative'}</div>
                <div className="text-xs" style={{color:'#8a7aaa'}}>Crew: {userProfile?.crew || 'Lone Wolf'}
                  {userProfile?.fruit && <span className="fruit-tag">{userProfile.fruit}</span>}
                </div>
                <div className="text-xs text-bounty mt-1">Bounty: {calculateBounty(userProfile).toLocaleString()} ฿</div>
              </div>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="y2k-btn" style={{fontSize:'11px', padding:'2px 8px'}}>
              {showSettings ? '← Back' : '⚙ Settings'}
            </button>
          </div>

          {!showSettings ? (
            <>
              <ProgressBar current={myWeeklyHours} goal={myDailyGoal * 7} />
              <form onSubmit={handleLogHours} className="space-y-3 mt-4">
                <div>
                  <label className="text-xs block mb-1" style={{color:'#8a7aaa'}}>Date:</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="y2k-input" />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{color:'#8a7aaa'}}>Duration (hrs):</label>
                  <input type="number" step="0.1" value={duration} onChange={e => setDuration(e.target.value)} required placeholder="e.g. 2.5" className="y2k-input" />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{color:'#8a7aaa'}}>Topic:</label>
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="Quantum Physics" className="y2k-input" />
                </div>
                <button type="submit" disabled={loading} className="y2k-btn y2k-btn-primary w-full mt-2">
                  {loading ? "Loading..." : "COMMIT_HOURS()"}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleUpdateSettings} className="space-y-3 mt-2">

               <div>
                  <label className="text-xs block mb-1" style={{color:'#8a7aaa'}}>Nickname:</label>
                  <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} required className="y2k-input" />
               </div>
               <div>
                  <label className="text-xs block mb-1" style={{color:'#8a7aaa'}}>Daily Goal (hrs):</label>
                  <input type="number" step="0.1" value={goal} onChange={e => setGoal(e.target.value)} required className="y2k-input" />
               </div>
               <button type="submit" disabled={loading} className="y2k-btn y2k-btn-primary w-full mt-2">
                  {loading ? "Saving..." : "SAVE_SETTINGS()"}
                </button>
            </form>
          )}
        </Y2KWindow>

        {/* LEADERBOARD WINDOW */}
        <Y2KWindow title="📊 LEADERBOARD.DAT" {...mkWindowCtrl('leaderboard')} className={windowStates.leaderboard === 'maximized' ? 'md:col-span-2' : ''}>
          {uniqueCrews.length > 0 && (
            <div className="flex gap-2 mb-3 pb-2 overflow-x-auto" style={{borderBottom: '1px solid #e0d0f0'}}>
              <button onClick={() => setLbTab('GLOBAL')} className={`y2k-btn ${lbTab === 'GLOBAL' ? 'y2k-btn-primary' : ''}`} style={{fontSize:'10px', padding:'2px 8px'}}>Global</button>
              {uniqueCrews.map(c => (
                <button key={c} onClick={() => setLbTab(c)} className={`y2k-btn ${lbTab === c ? 'y2k-btn-primary' : ''}`} style={{fontSize:'10px', padding:'2px 8px'}}>{c}</button>
              ))}
            </div>
          )}
          <div className="overflow-y-auto" style={{maxHeight: '380px'}}>
            <table className="y2k-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Operative</th>
                  <th className="text-right">Bounty</th>
                  <th className="text-right">% Goal</th>
                </tr>
              </thead>
              <tbody>
                {visibleLeaderboard.map((u, i) => (
                  <tr key={u.id}>
                    <td className="font-bold" style={{color:'#8a7aaa'}}>{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <img src={u.photoURL} className="w-6 h-6 border rounded-sm" style={{borderColor:'#c0b0d8'}} alt="" />
                        <div>
                          <span className={user.uid === u.id ? 'font-bold text-vapor-purple' : ''}>
                            {u.displayName}
                            {u.fruit && <span className="fruit-tag">{u.fruit}</span>}
                          </span>
                          {lbTab === 'GLOBAL' && u.crew && <div className="text-[9px]" style={{color:'#a090c0'}}>[{u.crew}]</div>}
                        </div>
                      </div>
                    </td>
                    <td className="text-right text-bounty">{calculateBounty(u).toLocaleString()} ฿</td>
                    <td className="text-right font-bold text-vapor-purple" title={`${Number(u.weeklyHours || 0).toFixed(1)} / ${(u.dailyGoal * 7).toFixed(1)} Weekly Hrs`}>
                      {u.goalPercentage !== undefined ? u.goalPercentage.toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Y2KWindow>
      </div>

      {/* PROFILE WINDOW (opens from desktop icon) */}
      {windowStates.profile !== 'closed' && (
        <div className="mt-6">
          <Y2KWindow title="👤 My Profile" {...mkWindowCtrl('profile')}>
            <div className="flex items-center gap-4 mb-4">
              <img src={userProfile?.photoURL || 'https://via.placeholder.com/80'} className="w-20 h-20 border-2 rounded-sm" style={{borderColor:'#c0a0e0'}} alt="" />
              <div>
                <div className="font-bold text-lg">{userProfile?.displayName || 'Operative'}</div>
                <div className="text-xs mt-1" style={{color:'#8a7aaa'}}>Crew: <strong>{userProfile?.crew || 'Lone Wolf'}</strong></div>
                <div className="text-xs" style={{color:'#8a7aaa'}}>Fruit: <strong>{userProfile?.fruit || 'None'}</strong> {userProfile?.fruit && FRUIT_REGISTRY.find(f=>f.id===userProfile.fruit)?.icon}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3" style={{border:'1px solid #e0d0f0'}}>
                <div className="text-2xl font-bold text-bounty">{calculateBounty(userProfile).toLocaleString()}</div>
                <div className="text-xs" style={{color:'#8a7aaa'}}>Bounty ฿</div>
              </div>
              <div className="p-3" style={{border:'1px solid #e0d0f0'}}>
                <div className="text-2xl font-bold" style={{color:'#8060c0'}}>{Number(userProfile?.totalStudyHours || 0).toFixed(1)}</div>
                <div className="text-xs" style={{color:'#8a7aaa'}}>Total Hours</div>
              </div>
              <div className="p-3" style={{border:'1px solid #e0d0f0'}}>
                <div className="text-2xl font-bold" style={{color:'#6080c0'}}>{userProfile?.dailyStudyGoal || 2}</div>
                <div className="text-xs" style={{color:'#8a7aaa'}}>Daily Goal</div>
              </div>
            </div>
          </Y2KWindow>
        </div>
      )}

      {/* DEVIL FRUITS WINDOW (opens from desktop icon) */}
      {windowStates.fruits !== 'closed' && (
        <div className="mt-6">
          <Y2KWindow title="🍇 Devil Fruits Encyclopedia" {...mkWindowCtrl('fruits')}>
            <DevilFruitsWindow userProfile={userProfile} />
          </Y2KWindow>
        </div>
      )}
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
    try { await db.collection('users').doc(uid).update({ [field]: val }); }
    catch(err) { alert("God-Mode Error: " + err.message); }
  };

  const handleDeleteUser = async (uid) => {
    if(!confirm("WARNING: Purge operative entirely?")) return;
    try {
      const dbBatch = db.batch();
      const sessions = await db.collection('studySessions').where('userId', '==', uid).get();
      sessions.docs.forEach(doc => dbBatch.delete(doc.ref));
      dbBatch.delete(db.collection('users').doc(uid));
      await dbBatch.commit();
    } catch(err) { alert("Error deleting user"); }
  };

  const openHistory = async (u) => {
    setHistoryModal(u);
    const snap = await db.collection('studySessions').where('userId', '==', u.id).get();
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    sessions.sort((a,b) => new Date(b.date) - new Date(a.date));
    setUserSessions(sessions);
  };
  const closeHistory = () => { setHistoryModal(null); setUserSessions([]); };

  const handleEditSession = async (sessionId, field, newValue, oldDuration) => {
    try {
      if (field === 'duration') {
        const diff = Number(newValue) - Number(oldDuration);
        if (isNaN(diff)) return;
        const dbBatch = db.batch();
        dbBatch.update(db.collection('studySessions').doc(sessionId), { duration: Number(newValue) });
        dbBatch.update(db.collection('users').doc(historyModal.id), { totalStudyHours: firebase.firestore.FieldValue.increment(diff) });
        await dbBatch.commit();
      } else {
        await db.collection('studySessions').doc(sessionId).update({ [field]: newValue });
      }
    } catch(e) { alert("Error editing session"); }
  };

  const handleDeleteSession = async (sessionId, duration) => {
    if(!confirm("Delete this session?")) return;
    try {
      const dbBatch = db.batch();
      dbBatch.delete(db.collection('studySessions').doc(sessionId));
      dbBatch.update(db.collection('users').doc(historyModal.id), { totalStudyHours: firebase.firestore.FieldValue.increment(-Number(duration)) });
      await dbBatch.commit();
      setUserSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch(e) { alert("Error"); }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto relative z-10">
      <Y2KWindow title="⚡ SUDO_ROOT.EXE" danger={true} className="min-h-[500px]">
        <h2 className="text-lg mb-4 admin-header font-bold blinking-cursor">⚠ God-Mode Activated</h2>
        <div className="overflow-x-auto">
          <table className="y2k-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Name / Crew / Fruit</th>
                <th>Daily(H)</th>
                <th>Total(H)</th>
                <th>Base Bounty</th>
                <th>Bounty Override</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="text-xs max-w-[120px] truncate" title={u.displayName}>{u.displayName || 'Unknown'}</td>
                  <td>
                    <div className="font-bold text-xs truncate max-w-[100px]">{u.displayName}</div>
                    <input type="text" defaultValue={u.crew || ''} placeholder="Crew"
                      onBlur={e => handleUpdateField(u.id, 'crew', e.target.value.trim().toUpperCase(), false)}
                      className="y2k-input mt-1" style={{fontSize:'10px', padding:'2px 4px'}} />
                    <select defaultValue={u.fruit || 'NONE'} 
                      onChange={e => handleUpdateField(u.id, 'fruit', e.target.value === 'NONE' ? null : e.target.value, false)}
                      className="y2k-input mt-1" style={{fontSize:'10px', padding:'2px 4px', color:'#8060c0'}}>
                      <option value="NONE">No Fruit</option>
                      {FRUIT_REGISTRY.map(f => <option key={f.id} value={f.id}>{f.icon} {f.id}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type="number" step="0.1" defaultValue={u.dailyStudyGoal !== undefined ? u.dailyStudyGoal : (u.weeklyStudyGoal ? u.weeklyStudyGoal / 7 : 2)} 
                      onBlur={e => handleUpdateField(u.id, 'dailyStudyGoal', e.target.value, true)}
                      className="y2k-input" style={{width:'50px', textAlign:'center', fontSize:'12px'}} />
                  </td>
                  <td>
                    <input type="number" step="0.1" defaultValue={u.totalStudyHours} 
                      onBlur={e => handleUpdateField(u.id, 'totalStudyHours', e.target.value, true)}
                      className="y2k-input" style={{width:'60px', textAlign:'center', fontSize:'12px'}} />
                  </td>
                  <td>
                    <input type="number" step="500" defaultValue={u.bountyBase !== undefined ? u.bountyBase : 10000} 
                      onBlur={e => handleUpdateField(u.id, 'bountyBase', e.target.value, true)}
                      title={`Computed: ${calculateBounty(u).toLocaleString()} ฿`}
                      className="y2k-input" style={{width:'70px', textAlign:'center', fontSize:'12px', color:'#c08020'}} />
                  </td>
                  <td>
                    <input type="number" step="500" 
                      defaultValue={u.bountyOverride !== undefined && u.bountyOverride !== null ? u.bountyOverride : ''}
                      placeholder={calculateBounty({...u, bountyOverride: null}).toLocaleString()}
                      onBlur={e => {
                        const val = e.target.value.trim();
                        if (val === '') {
                          handleUpdateField(u.id, 'bountyOverride', null, false);
                        } else {
                          handleUpdateField(u.id, 'bountyOverride', val, true);
                        }
                      }}
                      title="Set override (empty = use computed)"
                      className="y2k-input" style={{width:'80px', textAlign:'center', fontSize:'12px', color:'#e06020'}} />
                    <div className="text-[9px] mt-1" style={{color:'#a090c0'}}>
                      Show: {calculateBounty(u).toLocaleString()} ฿
                    </div>
                  </td>
                  <td className="space-x-1 whitespace-nowrap">
                    <button onClick={() => openHistory(u)} className="y2k-btn" style={{fontSize:'10px', padding:'2px 6px'}}>History</button>
                    <button onClick={() => handleDeleteUser(u.id)} className="y2k-btn y2k-btn-danger" style={{fontSize:'10px', padding:'2px 6px'}}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Y2KWindow>

      {historyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Y2KWindow title={`History: ${historyModal.displayName}`} danger={true} className="w-full max-w-2xl max-h-[80vh]">
            <div className="flex justify-end mb-3">
              <button onClick={closeHistory} className="y2k-btn y2k-btn-danger" style={{fontSize:'11px'}}>✕ Close</button>
            </div>
            <table className="y2k-table">
              <thead><tr><th>Date</th><th>Topic</th><th>Hrs</th><th>Action</th></tr></thead>
              <tbody>
                {userSessions.length === 0 ? <tr><td colSpan="4" className="text-center py-4" style={{color:'#a090c0'}}>No data found.</td></tr> : null}
                {userSessions.map(s => (
                  <tr key={s.id}>
                    <td><input type="date" defaultValue={s.date} onBlur={e => handleEditSession(s.id, 'date', e.target.value, s.duration)} className="y2k-input" style={{fontSize:'11px', width:'120px'}} /></td>
                    <td><input type="text" defaultValue={s.topic} onBlur={e => handleEditSession(s.id, 'topic', e.target.value, s.duration)} className="y2k-input" style={{fontSize:'11px'}} /></td>
                    <td><input type="number" step="0.1" defaultValue={s.duration} onBlur={e => handleEditSession(s.id, 'duration', e.target.value, s.duration)} className="y2k-input" style={{fontSize:'11px', width:'50px', textAlign:'right'}} /></td>
                    <td><button onClick={() => handleDeleteSession(s.id, s.duration)} className="y2k-btn y2k-btn-danger" style={{fontSize:'10px', padding:'1px 6px'}}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-xs" style={{color:'#a090c0'}}>* Editing hours auto-adjusts operative's total.</div>
          </Y2KWindow>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------
// MAIN APP COMPONENT
// ---------------------------------------------------------
function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('TRACKER'); 
  
  // Window state management
  const [windowStates, setWindowStates] = useState({
    tracker: 'normal',
    leaderboard: 'normal',
    profile: 'closed',
    fruits: 'closed',
  });

  const setWindowState = useCallback((id, state) => {
    setWindowStates(prev => ({ ...prev, [id]: state }));
  }, []);

  const handleDesktopOpen = useCallback((id) => {
    setWindowStates(prev => ({ ...prev, [id]: 'normal' }));
  }, []);

  const handleRestoreWindow = useCallback((id) => {
    setWindowStates(prev => ({ ...prev, [id]: 'normal' }));
  }, []);

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
              dailyStudyGoal: 2, weeklyStudyGoal: 10,
              totalStudyHours: 0, crew: null, fruit: null, bountyBase: 10000,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await userRef.set(newProfile);
            setUserProfile(newProfile);
          } else {
            setUserProfile(docInfo.data());
          }
          userRef.onSnapshot(doc => { if (doc.exists) setUserProfile(doc.data()); });
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error("Auth error:", err);
        alert("System error :( Database access denied.");
      } finally { setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try { await auth.signInWithPopup(provider); }
    catch(err) { alert("System error :( Connection refused."); }
  };
  const handleLogout = () => auth.signOut();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Y2KWindow title="Loading..." className="w-[300px]">
          <div className="text-center py-4">
            <div className="mb-3">Initializing system...</div>
            <div className="y2k-progress-track">
              <div className="y2k-progress-fill" style={{width: '60%'}}></div>
            </div>
          </div>
        </Y2KWindow>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 relative">
      <SparkleBackground />
      {user && <DesktopIcons onOpen={handleDesktopOpen} />}
      <Taskbar user={user} onLogout={handleLogout} isAdmin={user?.email === ADMIN_EMAIL} view={view}
        onToggleAdmin={() => setView(view === 'ADMIN' ? 'TRACKER' : 'ADMIN')}
        windowStates={windowStates} onRestoreWindow={handleRestoreWindow} />

      <header className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-4 flex items-center justify-center relative z-10">
        <div className="text-2xl font-bold tracking-widest" style={{color:'#4a3a6a'}}>
          ☆ STUDY_NET ~ V2.0 ☆
        </div>
      </header>

      {!user ? (
        <div className="flex items-center justify-center mt-16 relative z-10">
          <Y2KWindow title="Welcome!" className="w-[380px]">
             <div className="text-center space-y-6 py-6">
               <div className="y2k-gradient-box w-24 h-24 mx-auto rounded-sm"></div>
               <div className="text-base font-bold">Access Restricted</div>
               <p className="text-xs" style={{color:'#8a7aaa'}}>Please identify yourself to continue.</p>
               <button onClick={handleLogin} className="y2k-btn y2k-btn-primary w-full text-sm">
                 ☆ Initialize Google Auth
               </button>
             </div>
          </Y2KWindow>
        </div>
      ) : (
        view === 'ADMIN' && user.email === ADMIN_EMAIL ? (
          <AdminPanel user={user} />
        ) : (
          <Dashboard user={user} userProfile={userProfile} windowStates={windowStates} setWindowState={setWindowState} />
        )
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
