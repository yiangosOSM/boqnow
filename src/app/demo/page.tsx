// src/app/demo/page.tsx — Static demo BOQ, no auth required
import Link from 'next/link'

const DEMO_BOQ = {
  projectName: "Κατοικία Παπαδόπουλος — Ισόγειο + Α' Όροφος",
  location: "Λεμεσός, Κύπρος",
  totalArea: 148,
  grandTotal: 187450,
  confidence: "medium",
  generatedAt: "2025-06-10",
  categories: [
    { code:"1", title:"Προκαταρκτικά", subtotal:5500, items:[
      { aa:"1.1", description:"Εγκατάσταση εργοταξίου, προσωρινές εγκαταστάσεις, φράχτες ασφαλείας", unit:"Όλον", qty:1, unitPrice:3500, total:3500 },
      { aa:"1.2", description:"Σκαλωσιά εξωτερικών εργασιών", unit:"m²", qty:250, unitPrice:8, total:2000 },
    ]},
    { code:"2", title:"Χωματουργικά", subtotal:8640, items:[
      { aa:"2.1", description:"Γενικός καθαρισμός και ισοπέδωση οικοπέδου με αποκομιδή", unit:"Όλον", qty:1, unitPrice:1200, total:1200 },
      { aa:"2.2", description:"Εκσκαφή για πεδιλοκοιτόστρωση θεμελίωσης ισογείου", unit:"m³", qty:420, unitPrice:12, total:5040 },
      { aa:"2.3", description:"Επιχωμάτωση και συμπύκνωση", unit:"m³", qty:180, unitPrice:8, total:1440 },
      { aa:"2.4", description:"Αποκομιδή πλεοναζόντων χωμάτων εκτός εργοταξίου", unit:"m³", qty:96, unitPrice:10, total:960 },
    ]},
    { code:"3", title:"Σκυρόδεμα & Οπλισμός", subtotal:42800, items:[
      { aa:"3.1", description:"Σκυρόδεμα C16/20 για πεδιλοδοκούς θεμελίωσης", unit:"m³", qty:38, unitPrice:165, total:6270 },
      { aa:"3.2", description:"Σκυρόδεμα C25/30 για υποστυλώματα", unit:"m³", qty:22, unitPrice:225, total:4950 },
      { aa:"3.3", description:"Σκυρόδεμα C25/30 για δοκούς και πλάκες ορόφου", unit:"m³", qty:68, unitPrice:210, total:14280 },
      { aa:"3.4", description:"Οπλισμός χάλυβα S500s", unit:"kg", qty:8200, unitPrice:1.45, total:11890 },
      { aa:"3.5", description:"Ξυλότυπος πλακών ορόφου", unit:"m²", qty:148, unitPrice:22, total:3256 },
      { aa:"3.6", description:"Ξυλότυπος θεμελίων και τοιχίων", unit:"m²", qty:95, unitPrice:18, total:1710 },
    ]},
    { code:"4", title:"Τοίχοι / Τοιχοποιία", subtotal:17838, items:[
      { aa:"4.1", description:"Τοιχοποιία εξωτερικών τοίχων τούβλο 25cm", unit:"m²", qty:186, unitPrice:55, total:10230 },
      { aa:"4.2", description:"Τοιχοποιία εσωτερικών διαχωριστικών τοίχων τούβλο 12cm", unit:"m²", qty:148, unitPrice:38, total:5624 },
      { aa:"4.3", description:"Τοιχοποιία WC και λουτρών τούβλο 9cm", unit:"m²", qty:62, unitPrice:32, total:1984 },
    ]},
    { code:"5", title:"Επιχρίσματα & Μονώσεις", subtotal:29904, items:[
      { aa:"5.1", description:"Εξωτερικό τριφτό επίχρισμα τσιμεντοκονίας", unit:"m²", qty:420, unitPrice:22, total:9240 },
      { aa:"5.2", description:"Εσωτερικό επίχρισμα τριφτό όλων των χώρων", unit:"m²", qty:680, unitPrice:18, total:12240 },
      { aa:"5.3", description:"Υδατομόνωση ταράτσας με ελαστομερή ασφαλτική μεμβράνη", unit:"m²", qty:80, unitPrice:35, total:2800 },
      { aa:"5.4", description:"Θερμομόνωση XPS 8cm κάτω από δαπεδόπλακα", unit:"m²", qty:148, unitPrice:38, total:5624 },
    ]},
    { code:"6", title:"Δάπεδα & Επενδύσεις", subtotal:19852, items:[
      { aa:"6.1", description:"Τσιμεντοκονία ισοπέδωσης 5cm σε όλους τους χώρους", unit:"m²", qty:148, unitPrice:18, total:2664 },
      { aa:"6.2", description:"Πλακίδια δαπέδου 60x60 εσωτερικών χώρων (supply & lay)", unit:"m²", qty:148, unitPrice:55, total:8140 },
      { aa:"6.3", description:"Πλακίδια δαπέδου βεράντας αντιολισθητικά 40x40", unit:"m²", qty:48, unitPrice:45, total:2160 },
      { aa:"6.4", description:"Επένδυση τοίχων WC/λουτρών με πλακίδια έως ύψος 2.20m", unit:"m²", qty:86, unitPrice:48, total:4128 },
      { aa:"6.5", description:"Σοβατεπί MDF βαμμένο σε όλους τους χώρους", unit:"m", qty:184, unitPrice:15, total:2760 },
    ]},
    { code:"9", title:"Αλουμίνια & Κουφώματα", subtotal:26770, items:[
      { aa:"9.1", description:"Αλουμινένια κουφώματα ανοιγόμενα τύπου premium (Rabel ή ισοδύναμο) διπλό τζάμι Low-E", unit:"m²", qty:42, unitPrice:480, total:20160 },
      { aa:"9.2", description:"Εσωτερικές πόρτες HDF βαμμένες με κάσα και αξεσουάρ", unit:"τεμ.", qty:12, unitPrice:280, total:3360 },
      { aa:"9.3", description:"Πόρτα εισόδου ασφαλείας με κλειδαριά ασφαλείας", unit:"τεμ.", qty:1, unitPrice:950, total:950 },
      { aa:"9.4", description:"Πόρτες WC αλουμίνιο ή PVC", unit:"τεμ.", qty:3, unitPrice:220, total:660, isProvisional:false },
      { aa:"9.5", description:"Περσίδες/ρολά αλουμινίου εξωτερικών ανοιγμάτων", unit:"m²", qty:28, unitPrice:130, total:3640 },
    ]},
    { code:"10", title:"Υδραυλικά / Αποχετεύσεις", subtotal:14200, items:[
      { aa:"10.1", description:"Σωλήνωση ύδρευσης PPR — εσωτερικό δίκτυο", unit:"m", qty:120, unitPrice:22, total:2640 },
      { aa:"10.2", description:"Σωλήνωση αποχέτευσης PVC", unit:"m", qty:85, unitPrice:18, total:1530 },
      { aa:"10.3", description:"Λεκάνη WC με καζανάκι αποτοίχου", unit:"τεμ.", qty:3, unitPrice:380, total:1140 },
      { aa:"10.4", description:"Νιπτήρας με μπαταρία μίξεως", unit:"τεμ.", qty:3, unitPrice:280, total:840 },
      { aa:"10.5", description:"Ντουζιέρα με μπαταρία θερμοστάτη", unit:"τεμ.", qty:2, unitPrice:320, total:640 },
      { aa:"10.6", description:"Μπανιέρα ακρυλική με μπαταρία", unit:"τεμ.", qty:1, unitPrice:480, total:480 },
      { aa:"10.7", description:"Θερμοσίφωνας ηλιακός 200L με βοηθητική αντίσταση", unit:"τεμ.", qty:1, unitPrice:1850, total:1850 },
      { aa:"10.8", description:"Φρεάτια αποχέτευσης, σχάρες, παγίδες υδροσίφωνα", unit:"Όλον", qty:1, unitPrice:980, total:980 },
      { aa:"10.9", description:"Κεντρικός μετρητής νερού, παροχή, βαλβίδες", unit:"Όλον", qty:1, unitPrice:1200, total:1200, isProvisional:true },
      { aa:"10.10", description:"Εξωτερική αποχέτευση και σύνδεση με δημοτικό δίκτυο", unit:"Όλον", qty:1, unitPrice:3100, total:3100, isProvisional:true },
    ]},
    { code:"11", title:"Ηλεκτρολογικά", subtotal:11200, items:[
      { aa:"11.1", description:"Κυκλώματα φωτισμού", unit:"κύκλ.", qty:14, unitPrice:180, total:2520 },
      { aa:"11.2", description:"Κυκλώματα ρευματοδοτών", unit:"κύκλ.", qty:10, unitPrice:180, total:1800 },
      { aa:"11.3", description:"Ηλεκτρολογικός πίνακας 3φασικός 24 θέσεων", unit:"τεμ.", qty:1, unitPrice:1320, total:1320 },
      { aa:"11.4", description:"Ρευματοδότες διπλοί/μονοί", unit:"τεμ.", qty:42, unitPrice:38, total:1596 },
      { aa:"11.5", description:"Διακόπτες φωτισμού", unit:"τεμ.", qty:28, unitPrice:32, total:896 },
      { aa:"11.6", description:"Παροχή ΑΗΚ, εξωτερική γραμμή, μετρητής", unit:"Όλον", qty:1, unitPrice:1800, total:1800, isProvisional:true },
      { aa:"11.7", description:"Δίκτυο internet/TV structured cabling", unit:"Όλον", qty:1, unitPrice:1268, total:1268 },
    ]},
    { code:"13", title:"Χρωματισμοί", subtotal:14560, items:[
      { aa:"13.1", description:"Εσωτερικοί χρωματισμοί με ακρυλικό 2 χέρια (στόκος + βαφή)", unit:"m²", qty:680, unitPrice:14, total:9520 },
      { aa:"13.2", description:"Εξωτερικοί χρωματισμοί με ακρυλικό 2 χέρια", unit:"m²", qty:420, unitPrice:12, total:5040 },
    ]},
    { code:"16", title:"Ποσά Αρχικού Κόστους & Προνοητικά Ποσά", subtotal:7100, items:[
      { aa:"16.1", description:"Προνοητικό ποσό για εξωτερικές εργασίες (περίφραξη, πύλη, πλακόστρωση)", unit:"Όλον", qty:1, unitPrice:5000, total:5000, isProvisional:true },
      { aa:"16.2", description:"Απρόβλεπτα 2.5% επί συνολικού κόστους", unit:"Όλον", qty:1, unitPrice:2100, total:2100, isProvisional:true },
    ]},
  ],
  assumptions:[
    "Ύψος ορόφου 2.80m καθαρό (assumption — δεν αναγράφεται στα σχέδια)",
    "Τυπικές εδαφικές συνθήκες χωρίς ειδική θεμελίωση",
    "Πλακίδια μέσης ποιότητας €45–55/m² (supply included)",
    "Αλουμίνια premium series — επιβεβαιώστε specs με αρχιτέκτονα",
  ],
  exclusions:["Κουζίνα και έπιπλα","Φωτιστικά σώματα","Κλιματισμός / Αντλία θερμότητας","Πισίνα","Φωτοβολταϊκά","Ανελκυστήρας"],
}

function fmt(n:number){return '€'+n.toLocaleString('el-GR',{minimumFractionDigits:0,maximumFractionDigits:0})}

export default function DemoPage(){
  return(
    <div style={{fontFamily:'Inter, sans-serif',background:'#FAFAFA',minHeight:'100vh',color:'#0A0A0A'}}>
      <nav style={{padding:'0 32px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',background:'#0A0A0A',position:'sticky',top:0,zIndex:10}}>
        <Link href="/" style={{fontFamily:'Georgia, serif',fontSize:20,color:'#FAFAFA',textDecoration:'none'}}>BOQNOW</Link>
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <span style={{fontSize:12,color:'#9A9A9A',background:'#1A1A1A',padding:'4px 10px',borderRadius:4}}>DEMO</span>
          <Link href="/sign-up" style={{padding:'8px 18px',background:'#FAFAFA',color:'#0A0A0A',borderRadius:6,fontSize:13,textDecoration:'none',fontWeight:600}}>Δοκίμασε με τα δικά σου σχέδια →</Link>
        </div>
      </nav>
      <div style={{maxWidth:920,margin:'0 auto',padding:'40px 24px 80px'}}>
        <div style={{background:'#FFF8E6',border:'1px solid #E8D88A',borderRadius:8,padding:'14px 20px',marginBottom:32,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:18}}>👁️</span>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:'#8B6914'}}>Demo BOQ — Πραγματικό παράδειγμα εξόδου BOQNOW</div>
            <div style={{fontSize:13,color:'#8B6914'}}>Παράγεται από αρχιτεκτονικά σχέδια κατοικίας 148m² · Λεμεσός. Ανέβασε τα δικά σου για προσωπικό BOQ.</div>
          </div>
        </div>
        <div style={{marginBottom:28,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontFamily:'Georgia, serif',fontSize:24,marginBottom:6,letterSpacing:'-0.5px'}}>{DEMO_BOQ.projectName}</h1>
            <div style={{display:'flex',gap:14,fontSize:13,color:'#9A9A9A',flexWrap:'wrap'}}>
              <span>📍 {DEMO_BOQ.location}</span>
              <span>📐 {DEMO_BOQ.totalArea} m²</span>
              <span>📅 {DEMO_BOQ.generatedAt}</span>
              <span style={{background:'#FFF8E6',color:'#B8860B',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600}}>ΜΕΤΡΙΑ ΑΚΡΙΒΕΙΑ</span>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:12,color:'#9A9A9A',marginBottom:2}}>ΣΥΝΟΛΟ (χωρίς ΦΠΑ)</div>
            <div style={{fontFamily:'Georgia, serif',fontSize:32,letterSpacing:'-1px'}}>{fmt(DEMO_BOQ.grandTotal)}</div>
          </div>
        </div>
        {DEMO_BOQ.categories.map(cat=>(
          <div key={cat.code} style={{marginBottom:20,border:'1px solid #E8E8E8',borderRadius:8,overflow:'hidden'}}>
            <div style={{background:'#0A0A0A',padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'#FAFAFA',fontSize:14,fontWeight:600}}>{cat.code}. {cat.title}</span>
              <span style={{color:'#9A9A9A',fontFamily:'Georgia, serif',fontSize:14}}>{fmt(cat.subtotal)}</span>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#F8F8F8',borderBottom:'1px solid #E8E8E8'}}>
                  <th style={{padding:'8px 12px',textAlign:'left',color:'#9A9A9A',fontWeight:500,width:44}}>Α/Α</th>
                  <th style={{padding:'8px 12px',textAlign:'left',color:'#9A9A9A',fontWeight:500}}>Περιγραφή</th>
                  <th style={{padding:'8px 12px',textAlign:'center',color:'#9A9A9A',fontWeight:500,width:56}}>Μον.</th>
                  <th style={{padding:'8px 12px',textAlign:'right',color:'#9A9A9A',fontWeight:500,width:64}}>Ποσ.</th>
                  <th style={{padding:'8px 12px',textAlign:'right',color:'#9A9A9A',fontWeight:500,width:76}}>Τιμή</th>
                  <th style={{padding:'8px 12px',textAlign:'right',color:'#9A9A9A',fontWeight:500,width:88}}>Σύνολο</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map((item,i)=>(
                  <tr key={item.aa} style={{borderBottom:i<cat.items.length-1?'1px solid #F0F0F0':'none',background:(item as any).isProvisional?'#FDFDF5':'#fff'}}>
                    <td style={{padding:'10px 12px',color:'#9A9A9A'}}>{item.aa}</td>
                    <td style={{padding:'10px 12px',lineHeight:1.5}}>
                      {item.description}
                      {(item as any).isProvisional&&<span style={{marginLeft:8,fontSize:10,background:'#FFF8E6',color:'#B8860B',padding:'1px 6px',borderRadius:3,fontWeight:600}}>ΠΡΟΝΟΗΤΙΚΟ</span>}
                    </td>
                    <td style={{padding:'10px 12px',textAlign:'center',color:'#5A5A5A'}}>{item.unit}</td>
                    <td style={{padding:'10px 12px',textAlign:'right',color:'#5A5A5A'}}>{item.qty.toLocaleString('el-GR')}</td>
                    <td style={{padding:'10px 12px',textAlign:'right',color:'#5A5A5A'}}>{fmt(item.unitPrice)}</td>
                    <td style={{padding:'10px 12px',textAlign:'right',fontWeight:500}}>{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:'#F8F8F8',borderTop:'1px solid #E8E8E8'}}>
                  <td colSpan={5} style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:'#5A5A5A',textTransform:'uppercase'}}>Υποσύνολο {cat.title}</td>
                  <td style={{padding:'10px 12px',textAlign:'right',fontWeight:700,fontFamily:'Georgia, serif'}}>{fmt(cat.subtotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}
        <div style={{background:'#0A0A0A',borderRadius:8,padding:'24px 28px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div>
            <div style={{color:'#9A9A9A',fontSize:12,marginBottom:4}}>ΓΕΝΙΚΟ ΣΥΝΟΛΟ (χωρίς ΦΠΑ)</div>
            <div style={{color:'#9A9A9A',fontSize:11}}>+ ΦΠΑ 19%: {fmt(Math.round(DEMO_BOQ.grandTotal*0.19))} · Σύνολο με ΦΠΑ: {fmt(Math.round(DEMO_BOQ.grandTotal*1.19))}</div>
          </div>
          <div style={{fontFamily:'Georgia, serif',fontSize:36,color:'#FAFAFA',letterSpacing:'-1px'}}>{fmt(DEMO_BOQ.grandTotal)}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:28}}>
          <div style={{border:'1px solid #E8E8E8',borderRadius:8,padding:'20px'}}>
            <h3 style={{fontSize:12,fontWeight:600,marginBottom:12,color:'#5A5A5A',textTransform:'uppercase',letterSpacing:'0.05em'}}>Παραδοχές</h3>
            {DEMO_BOQ.assumptions.map((a,i)=>(
              <div key={i} style={{fontSize:13,color:'#5A5A5A',padding:'6px 0',borderBottom:i<DEMO_BOQ.assumptions.length-1?'1px solid #F0F0F0':'none',lineHeight:1.5}}>⚠ {a}</div>
            ))}
          </div>
          <div style={{border:'1px solid #E8E8E8',borderRadius:8,padding:'20px'}}>
            <h3 style={{fontSize:12,fontWeight:600,marginBottom:12,color:'#5A5A5A',textTransform:'uppercase',letterSpacing:'0.05em'}}>Εξαιρέσεις</h3>
            {DEMO_BOQ.exclusions.map((e,i)=>(
              <div key={i} style={{fontSize:13,color:'#5A5A5A',padding:'6px 0',borderBottom:i<DEMO_BOQ.exclusions.length-1?'1px solid #F0F0F0':'none'}}>✕ {e}</div>
            ))}
          </div>
        </div>
        <div style={{background:'#F8F0F0',border:'1px solid #E8D0D0',borderRadius:8,padding:'16px 20px',marginBottom:40,fontSize:12,color:'#8B4444',lineHeight:1.6}}>
          <strong>Αποποίηση ευθύνης:</strong> Το παρόν BOQ παρήχθη αυτόματα από το σύστημα BOQNOW βάσει αρχιτεκτονικών σχεδίων. Αποτελεί εκτίμηση και ΔΕΝ αντικαθιστά επαγγελματικό Δελτίο Ποσοτήτων πιστοποιημένου Ποσομετρητή (QS). Τιμές χωρίς ΦΠΑ. Απαιτείται επαλήθευση πριν από χρήση σε διαγωνισμό ή σύμβαση.
        </div>
        <div style={{background:'#0A0A0A',borderRadius:12,padding:'40px',textAlign:'center'}}>
          <h2 style={{fontFamily:'Georgia, serif',fontSize:26,color:'#FAFAFA',marginBottom:12,letterSpacing:'-0.5px'}}>Έτοιμος να δεις το δικό σου BOQ;</h2>
          <p style={{color:'#9A9A9A',fontSize:15,marginBottom:28}}>Ανέβασε τα αρχιτεκτονικά σχέδιά σου και πάρε πλήρες ΜΕΔΣΚ BOQ σε λίγα λεπτά.</p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/sign-up" style={{padding:'14px 28px',background:'#FAFAFA',color:'#0A0A0A',borderRadius:8,fontSize:15,textDecoration:'none',fontWeight:600}}>Ξεκίνα δωρεάν — 7 μέρες</Link>
            <Link href="/pricing" style={{padding:'14px 28px',background:'transparent',color:'#9A9A9A',border:'1px solid #2A2A2A',borderRadius:8,fontSize:15,textDecoration:'none'}}>Δες τιμές →</Link>
          </div>
          <p style={{marginTop:14,fontSize:12,color:'#5A5A5A'}}>Δεν απαιτείται πιστωτική κάρτα</p>
        </div>
      </div>
    </div>
  )
}
