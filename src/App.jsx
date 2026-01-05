import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  onSnapshot,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import {
  GraduationCap,
  Calendar,
  MessageSquare,
  Search,
  Plus,
  Trash2,
  Star,
  LogOut,
  Menu,
  X,
  Settings,
  Edit2
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDbekfSWP6gVnGIxZp2Cr26PsRz2qveXAY",
  authDomain: "grobes-app.firebaseapp.com",
  projectId: "grobes-app",
  storageBucket: "grobes-app.firebasestorage.app",
  messagingSenderId: "980585133032",
  appId: "1:980585133032:web:72a770dda1f33358f1aa5d",
  measurementId: "G-7L7LSBMLQ0"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'globis-credit-app';

// --- Initial Master Course Data (For Seeding) ---
const INITIAL_COURSE_MASTER = [
  { id: 'ob', name: '組織行動とリーダーシップ', units: 1.5, category: '基本', field: '組織・人事', report: 'Day4' },
  { id: 'hrm', name: '人材マネジメント', units: 1.5, category: '基本', field: '組織・人事', report: 'Day4' },
  { id: 'mkt-base', name: 'マーケティング・経営戦略基礎', units: 1.5, category: '基本', field: 'マーケ・戦略', report: '--' },
  { id: 'mkt', name: 'マーケティング', units: 1.5, category: '基本', field: 'マーケ・戦略', report: 'Day4' },
  { id: 'str', name: '経営戦略', units: 1.5, category: '基本', field: 'マーケ・戦略', report: 'Day4' },
  { id: 'acc-base', name: 'アカウンティング基礎', units: 1.5, category: '基本', field: '会計・財務', report: '--' },
  { id: 'fin-base', name: 'ファイナンス基礎', units: 1.5, category: '基本', field: '会計・財務', report: '--' },
  { id: 'ct', name: 'クリティカル・シンキング', units: 1.5, category: '基本', field: '思考', report: 'Day4' },
  { id: 'ba', name: 'ビジネス・アナリティクス', units: 1.5, category: '基本', field: '思考', report: 'Day4' },
  { id: 'ld-eth', name: 'リーダーシップ開発と倫理・価値観', units: 1.5, category: '基本', field: '志', report: 'Day6' },
  { id: 'ts', name: 'テクノベート・シンキング', units: 1.5, category: '基本', field: 'テクノベート', report: 'Day4' },
  { id: 'pwr', name: 'パワーと影響力', units: 1.5, category: '応用', field: '組織・人事', report: 'Day4' },
  { id: 'cj-brd', name: 'カスタマージャーニーとブランディング', units: 1.5, category: '応用', field: 'マーケ・戦略', report: 'Day6' },
  { id: 'acc2', name: 'アカウンティングII（管理会計）', units: 1.5, category: '応用', field: '会計・財務', report: 'Day4' },
  { id: 'fin2', name: 'ファイナンスII（企業価値評価）', units: 1.5, category: '応用', field: '会計・財務', report: 'Day4' },
  { id: 'fn-ng', name: 'ファシリテーション＆ネゴシエーション', units: 1.5, category: '応用', field: '思考', report: 'Day4' },
  { id: 'e-ld', name: '企業家リーダーシップ', units: 1.5, category: '応用', field: '志', report: 'Day6' },
  { id: 'tech-str', name: 'テクノベート・ストラテジー', units: 1.5, category: '応用', field: 'テクノベート', report: 'Day6' },
  { id: 'v-mgmt', name: 'ベンチャー・マネジメント', units: 1.5, category: '展開', field: '創造', report: 'Day4' },
  { id: 'inv-str', name: 'イノベーションによる事業構造変革', units: 1.5, category: '展開', field: '変革', report: 'Day4' },
  { id: 'global-p', name: 'グローバル・パースペクティブ', units: 1.5, category: '展開', field: 'Global', report: 'Day4' },
  { id: 'project', name: '研究・起業プロジェクト', units: 3.0, category: '展開', field: 'プロジェクト', report: '--' },
];

// --- Updated Terms (Universal) ---
const TERMS = [
  "1月期", "4月期", "7月期", "10月期"
];

// Navy Color Constants
const NAVY_MAIN = "bg-[#1e3a8a]"; // main navy
const NAVY_TEXT = "text-[#1e3a8a]"; // text navy
const NAVY_LIGHT = "bg-[#EFF6FF]"; // light background like blue-50
const NAVY_HOVER = "hover:bg-[#172554]"; // darker navy for hover

export default function App() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [myPlan, setMyPlan] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [teacherFilter, setTeacherFilter] = useState('');

  // Review State
  const [isReviewing, setIsReviewing] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTeacher, setReviewTeacher] = useState('');

  // Admin State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(null); // For Add/Edit Modal
  const [editCourseData, setEditCourseData] = useState({ name: '', category: '基本', field: '', units: 1.5, report: '' });

  // Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Data Sync
  useEffect(() => {
    // 1. Fetch Courses (Seed if empty)
    const coursesRef = collection(db, 'artifacts', appId, 'public', 'data', 'courses');
    const unsubscribeCourses = onSnapshot(coursesRef, async (snapshot) => {
      if (snapshot.empty) {
        console.log("Seeding courses...");
        // Seed initial data
        for (const course of INITIAL_COURSE_MASTER) {
          const newDocRef = doc(coursesRef); // Auto ID
          await setDoc(newDocRef, { ...course, originalId: course.id });
        }
      } else {
        setCourses(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      }
    }, (error) => console.error("Firestore Courses Error:", error));

    // 2. Public Reviews
    const reviewsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reviews');
    const unsubscribeReviews = onSnapshot(reviewsRef,
      (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      },
      (error) => console.error("Firestore Reviews Error:", error)
    );

    return () => {
      unsubscribeCourses();
      unsubscribeReviews();
    };
  }, []);

  // User Plan Sync
  useEffect(() => {
    if (!user) {
      setMyPlan([]);
      return;
    }
    const planRef = collection(db, 'artifacts', appId, 'users', user.uid, 'plans');
    const unsubscribePlan = onSnapshot(planRef,
      (snapshot) => {
        setMyPlan(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      },
      (error) => console.error("Firestore Plan Error:", error)
    );
    return () => unsubscribePlan();
  }, [user]);

  // Actions
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Failed", error);
    }
  };

  const addCourseToPlan = async (course, term) => {
    if (!user) return;
    const planRef = collection(db, 'artifacts', appId, 'users', user.uid, 'plans');
    await addDoc(planRef, {
      courseId: course.id,
      name: course.name,
      units: course.units,
      term: term,
      category: course.category,
      addedAt: Date.now()
    });
  };

  const removeCourseFromPlan = async (planId) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'plans', planId);
    await deleteDoc(docRef);
  };

  // Review Actions
  const submitReview = async () => {
    if (!user || !isReviewing) return;
    const reviewsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reviews');
    await addDoc(reviewsRef, {
      courseId: isReviewing.courseId || isReviewing.id, // Handle both from plan and course list
      courseName: isReviewing.name,
      comment: reviewText,
      rating: reviewRating,
      teacherName: reviewTeacher,
      userName: user.displayName || '受講生',
      uid: user.uid,
      createdAt: Date.now()
    });
    setIsReviewing(null);
    setReviewText('');
    setReviewTeacher('');
    setReviewRating(5);
  };

  // Admin Actions
  const handleSaveCourse = async () => {
    const coursesRef = collection(db, 'artifacts', appId, 'public', 'data', 'courses');

    if (isEditingCourse && isEditingCourse.id) {
      // Update
      const docRef = doc(coursesRef, isEditingCourse.id);
      await updateDoc(docRef, editCourseData);
    } else {
      // Add New
      await addDoc(coursesRef, editCourseData);
    }
    setIsEditingCourse(null);
    setEditCourseData({ name: '', category: '基本', field: '', units: 1.5, report: '' });
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("本当に削除しますか？")) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'courses', id);
    await deleteDoc(docRef);
  };

  const openCourseModal = (course = null) => {
    if (course) {
      setEditCourseData(course);
      setIsEditingCourse(course);
    } else {
      setEditCourseData({ name: '', category: '基本', field: '', units: 1.5, report: '' });
      setIsEditingCourse({ isNew: true });
    }
  };

  // Derived State
  const totalUnits = useMemo(() => {
    return myPlan.reduce((acc, curr) => acc + curr.units, 0);
  }, [myPlan]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = c.name.includes(searchTerm);
      const matchesCategory = filterCategory === 'All' || c.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, filterCategory, courses]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchesTeacher = teacherFilter ? (r.teacherName && r.teacherName.includes(teacherFilter)) : true;
      const matchesSearch = searchTerm ? (r.courseName.includes(searchTerm) || (r.comment && r.comment.includes(searchTerm))) : true;
      return matchesTeacher && matchesSearch;
    });
  }, [reviews, teacherFilter, searchTerm]);

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className={`${NAVY_MAIN} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20`}>
            <GraduationCap className="text-white w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Globis Planner</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            全期対応 / 36単位修了までの計画<br />
            あなたの学習の軌跡を記録しましょう
          </p>
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" />
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-800 font-sans pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className={`${NAVY_MAIN} p-1.5 rounded-lg`}>
            <GraduationCap className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg md:text-xl tracking-tight text-slate-800">Globis Planner</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsAdminMode(!isAdminMode)} className={`p-2 rounded-lg text-xs font-bold transition-colors ${isAdminMode ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
            {isAdminMode ? 'Admin Mode ON' : 'Admin'}
          </button>
          <div className="hidden md:block text-right">
            <p className="text-xs font-medium text-slate-400">Welcome,</p>
            <p className="text-sm font-bold text-slate-700">{user.displayName || 'Guest'}</p>
          </div>
          <button onClick={() => signOut(auth)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">

        {/* Progress Section */}
        <section className="bg-white rounded-[2rem] p-6 md:p-8 mb-8 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-1 text-slate-800">修了までの進捗</h2>
              <p className="text-slate-500 text-sm md:text-base">現在 {totalUnits} 単位取得予定 / 目標 36 単位</p>
            </div>
            <div className="flex items-end gap-1">
              <span className={`text-5xl font-black ${NAVY_TEXT} leading-none`}>{Math.round((totalUnits / 36) * 100)}</span>
              <span className="text-xl font-bold text-slate-400 mb-1">%</span>
            </div>
          </div>

          <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className={`absolute top-0 left-0 h-full ${NAVY_MAIN} transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(30,58,138,0.3)]`}
              style={{ width: `${Math.min((totalUnits / 36) * 100, 100)}%` }}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Timeline */}
          <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
            <h3 className={`text-xl font-bold flex items-center gap-2 ml-2 ${NAVY_TEXT}`}>
              <Calendar className="w-5 h-5" />
              履修タイムライン
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TERMS.map((term) => {
                const termCourses = myPlan.filter(p => p.term === term);
                const termUnits = termCourses.reduce((s, c) => s + c.units, 0);

                return (
                  <div key={term} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-700">{term}</h4>
                      <span className="bg-slate-50 px-2 py-1 rounded text-xs font-bold text-slate-500">
                        {termUnits} 単位
                      </span>
                    </div>
                    <div className="space-y-3 min-h-[80px]">
                      {termCourses.length > 0 ? (
                        termCourses.map(course => (
                          <div key={course.id} className="group relative bg-[#F8FAFC] p-3 rounded-xl flex items-center justify-between border border-transparent hover:border-slate-200 transition-all">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-700 leading-tight">{course.name}</p>
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{course.category}</span>
                            </div>
                            <div className="flex gap-2 items-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setIsReviewing(course)}
                                className={`p-1.5 bg-white shadow-sm rounded-lg ${NAVY_TEXT} hover:bg-blue-50`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeCourseFromPlan(course.id)}
                                className="p-1.5 bg-white shadow-sm rounded-lg text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-slate-100 rounded-xl">
                          <Plus className="w-5 h-5 text-slate-200" />
                          <span className="text-[10px] text-slate-300 font-bold uppercase mt-1 text-center">予定なし</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Course Selection */}
          <div className="lg:col-span-4 space-y-8 order-1 lg:order-2">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  {isAdminMode ? '科目の管理' : '科目を追加'}
                </h3>
                {isAdminMode && (
                  <button onClick={() => openCourseModal()} className={`${NAVY_MAIN} text-white p-2 rounded-lg`}>
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="科目名で検索..."
                    className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-900/10 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['All', '基本', '応用', '展開'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === cat ? `${NAVY_MAIN} text-white` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {filteredCourses.map(course => (
                  <div key={course.id} className="p-4 rounded-2xl bg-[#F8FAFC] hover:bg-white hover:shadow-md hover:ring-1 hover:ring-slate-200 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`bg-white px-2 py-0.5 rounded text-[10px] font-black ${NAVY_TEXT} uppercase`}>
                        {course.field}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">{course.units} 単位</span>
                        {isAdminMode && (
                          <div className="flex gap-1">
                            <button onClick={() => openCourseModal(course)} className="text-blue-500"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDeleteCourse(course.id)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm font-bold text-slate-700 mb-4 group-hover:${NAVY_TEXT} transition-colors`}>{course.name}</p>
                    <select
                      className={`w-full text-[10px] font-bold bg-white border border-slate-200 rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-blue-900/10 cursor-pointer`}
                      onChange={(e) => {
                        if (e.target.value) {
                          addCourseToPlan(course, e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">期を選択して追加</option>
                      {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Feed */}
            <div className={`${NAVY_MAIN} rounded-3xl p-6 shadow-lg shadow-blue-900/20`}>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">受講生のリアルな声</h3>

              {/* Teacher Filter */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-2.5 w-3 h-3 text-blue-300" />
                <input
                  type="text"
                  placeholder="講師名や科目で検索..."
                  className="w-full bg-blue-900/50 border border-blue-400/30 rounded-xl py-2 pl-8 pr-4 text-xs text-white placeholder-blue-300 focus:outline-none focus:border-blue-300 transition-all"
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                />
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar-white">
                {filteredReviews.length > 0 ? (
                  filteredReviews.sort((a, b) => b.createdAt - a.createdAt).map(review => (
                    <div key={review.id} className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="block text-[10px] font-bold text-blue-100 uppercase tracking-tight truncate max-w-[150px]">
                            {review.courseName}
                          </span>
                          {review.teacherName && (
                            <span className="block text-[10px] text-blue-300 mt-0.5 font-medium">
                              {review.teacherName} 講師
                            </span>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-2 h-2 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-white leading-relaxed mb-3">"{review.comment}"</p>
                      <span className="text-[10px] font-medium text-blue-200 italic">- {review.userName}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-blue-200 text-center py-4">条件に一致する口コミがありません</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {isReviewing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-1 text-slate-800">レビューを投稿</h3>
            <p className="text-slate-400 text-sm mb-6">{isReviewing.name}</p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">講師名 (任意)</label>
                <input
                  type="text"
                  placeholder="例: 山田 太郎"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm"
                  value={reviewTeacher}
                  onChange={(e) => setReviewTeacher(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">満足度</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setReviewRating(num)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${reviewRating >= num ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-100' : 'bg-slate-100 text-slate-400'}`}
                    >
                      <Star className={`w-5 h-5 ${reviewRating >= num ? 'fill-white' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-900/20 outline-none h-24 resize-none text-slate-700"
                placeholder="Day4の負荷や、内容の満足度などを教えてください..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />

              <div className="flex gap-3">
                <button onClick={() => setIsReviewing(null)} className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600">キャンセル</button>
                <button
                  onClick={submitReview}
                  disabled={!reviewText}
                  className={`flex-[2] ${NAVY_MAIN} ${NAVY_HOVER} text-white py-3 rounded-2xl font-bold shadow-lg shadow-blue-900/20 disabled:bg-slate-200 disabled:shadow-none transition-all`}
                >
                  投稿する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Course Modal */}
      {isEditingCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800">
              {isEditingCourse.isNew ? '新規科目登録' : '科目編集'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase">科目名</label>
                <input className="w-full bg-slate-50 rounded-lg p-2 mt-1 text-sm border border-slate-200"
                  value={editCourseData.name} onChange={(e) => setEditCourseData({ ...editCourseData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase">区分</label>
                  <select className="w-full bg-slate-50 rounded-lg p-2 mt-1 text-sm border border-slate-200"
                    value={editCourseData.category} onChange={(e) => setEditCourseData({ ...editCourseData, category: e.target.value })}>
                    <option value="基本">基本</option>
                    <option value="応用">応用</option>
                    <option value="展開">展開</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase">分野</label>
                  <input className="w-full bg-slate-50 rounded-lg p-2 mt-1 text-sm border border-slate-200"
                    value={editCourseData.field} onChange={(e) => setEditCourseData({ ...editCourseData, field: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase">単位数</label>
                <input type="number" step="0.5" className="w-full bg-slate-50 rounded-lg p-2 mt-1 text-sm border border-slate-200"
                  value={editCourseData.units} onChange={(e) => setEditCourseData({ ...editCourseData, units: parseFloat(e.target.value) })} />
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => setIsEditingCourse(null)} className="flex-1 py-2 text-slate-500 font-bold">キャンセル</button>
                <button onClick={handleSaveCourse} className={`flex-1 ${NAVY_MAIN} text-white rounded-xl font-bold py-2`}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar-white::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-white::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}