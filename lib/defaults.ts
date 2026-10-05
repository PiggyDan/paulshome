import type { Service } from "./catalog";

// Starting service list. Once the site has run, the live list lives in data/db.json and is edited from /admin.
export const DEFAULT_SERVICES: Omit<Service, "id">[] = [
  {
    slug: "doors-windows",
    category: "repairs",
    title: { en: "Doors & Windows", mn: "Хаалга, цонх" },
    description: {
      en: "Sticking doors, broken hinges, locks, frames and drafty window repairs.",
      mn: "Гацдаг хаалга, эвдэрсэн нугас, цоож, хүрээ, салхи оруулдаг цонхны засвар.",
    },
    details: {
      en: "Doors and windows take a beating from UB's temperature swings. Paul works out why a door sticks or a window leaks air, then fixes the cause rather than just the symptom, so it keeps working through the seasons.",
      mn: "Улаанбаатарын огцом температурын өөрчлөлт хаалга, цонхонд их нөлөөлдөг. Паул хаалга яагаад гацаж, цонх яагаад салхи оруулж байгааг тодорхойлж, зөвхөн шинж тэмдгийг бус шалтгааныг нь засдаг тул улирал бүрт хэвийн ажиллана.",
    },
    includes: {
      en: ["Adjusting and re-hanging sticking doors", "Replacing hinges, handles and locks", "Repairing or squaring door and window frames", "Sealing drafts around windows and doors"],
      mn: ["Гацдаг хаалгыг тохируулах, дахин суулгах", "Нугас, бариул, цоож солих", "Хаалга, цонхны хүрээ засах, тэгшлэх", "Хаалга цонхны завсраар орох салхийг битүүмжлэх"],
    },
  },
  {
    slug: "walls-ceilings",
    category: "repairs",
    title: { en: "Walls & Ceilings", mn: "Хана, тааз" },
    description: {
      en: "Patching holes, cracks and water damage, then finishing ready for paint.",
      mn: "Нүх, хагарал, усны гэмтлийг нөхөж, будахад бэлэн болгоно.",
    },
    details: {
      en: "Holes, cracks and water stains make a room look tired. Paul repairs the damaged area, blends it into the surrounding surface and leaves it smooth and ready for paint.",
      mn: "Нүх, хагарал, усны толбо өрөөг хуучирсан харагдуулдаг. Паул гэмтсэн хэсгийг засаж, орчны гадаргуутай тэгшилж, будахад бэлэн гөлгөр болгоно.",
    },
    includes: {
      en: ["Patching holes and dents", "Repairing cracks in walls and ceilings", "Fixing water-damaged sections", "Sanding and preparing for paint"],
      mn: ["Нүх, хонхорыг нөхөх", "Хана, таазны хагарлыг засах", "Усанд гэмтсэн хэсгийг засах", "Зүлгэж, будахад бэлтгэх"],
    },
  },
  {
    slug: "floors-stairs",
    category: "repairs",
    title: { en: "Floors & Stairs", mn: "Шал, шат" },
    description: {
      en: "Squeaky boards, loose steps, damaged sections and threshold repairs.",
      mn: "Шаржигнадаг шал, сул шатны гишгүүр, гэмтсэн хэсэг, босгоны засвар.",
    },
    details: {
      en: "Squeaks, loose steps and damaged boards are more than annoying; they can become a safety issue. Paul secures, repairs or replaces the affected sections so floors and stairs feel solid underfoot.",
      mn: "Шаржигнах чимээ, сул гишгүүр, гэмтсэн банз зөвхөн төвөгтэй биш, аюулгүй байдалд ч нөлөөлж болно. Паул гэмтсэн хэсгийг бэхэлж, засаж эсвэл сольж, шал, шатыг бат бөх болгоно.",
    },
    includes: {
      en: ["Fixing squeaky floorboards", "Securing loose stair treads and railings", "Replacing damaged floor sections", "Thresholds and transitions between rooms"],
      mn: ["Шаржигнадаг шалны банзыг засах", "Сул гишгүүр, хашлагыг бэхлэх", "Гэмтсэн шалны хэсгийг солих", "Өрөө хоорондын босго, залгаас"],
    },
  },
  {
    slug: "general-fix-it-jobs",
    category: "repairs",
    title: { en: "General Fix-It Jobs", mn: "Жижиг засварын ажил" },
    description: {
      en: "The list of small jobs that keeps growing. Shelves, fixtures, fittings and more.",
      mn: "Нэмэгдсээр байдаг жижиг ажлын жагсаалт. Тавиур, хэрэгсэл, холбох хэрэгсэл гэх мэт.",
    },
    details: {
      en: "Most homes have a list of small jobs waiting for someone with the right tools and some free time. Send Paul the list, and he'll work through it in one visit where possible.",
      mn: "Ихэнх айлд зөв багаж, чөлөөт цагтай хүнийг хүлээж буй жижиг ажлын жагсаалт байдаг. Жагсаалтаа Паулд илгээвэл боломжтой бол нэг очилтоор хийж дуусгана.",
    },
    includes: {
      en: ["Mounting shelves, mirrors and TVs", "Assembling and fixing furniture", "Replacing fixtures and fittings", "Small repairs around the house"],
      mn: ["Тавиур, толь, зурагт ханан дээр суулгах", "Тавилга угсрах, засах", "Хэрэгсэл, холбох хэрэгслийг солих", "Гэр доторх жижиг засварууд"],
    },
  },
  {
    slug: "wall-cladding-panelling",
    category: "woodwork",
    title: { en: "Wall Cladding & Panelling", mn: "Ханын модон өнгөлгөө" },
    description: {
      en: "Timber interior walls and ceilings for a warm, finished look.",
      mn: "Дулаан, гоё харагдах модон дотор хана, тааз.",
    },
    details: {
      en: "Timber cladding gives a room warmth and character, and it's one of Paul's specialties. He plans the layout, prepares the surface and fits each board cleanly, finishing it so it's easy to care for.",
      mn: "Модон өнгөлгөө өрөөнд дулаан, онцлог төрх өгдөг бөгөөд энэ нь Паулын онцлох ажлын нэг. Тэр байршлыг төлөвлөж, гадаргууг бэлтгэж, банз бүрийг цэвэрхэн суулгаад арчилахад хялбар байхаар өнгөлнө.",
    },
    includes: {
      en: ["Interior wall and ceiling panelling", "Choosing timber and finish", "Trim, corners and edge details", "Sealing or oiling the finished surface"],
      mn: ["Дотор хана, таазны модон өнгөлгөө", "Мод болон өнгөлгөөг сонгох", "Хүрээ, булан, ирмэгийн нарийн ажил", "Дууссан гадаргууг лак, тосоор хамгаалах"],
    },
  },
  {
    slug: "porches-decks",
    category: "woodwork",
    title: { en: "Porches & Decks", mn: "Веранда, тавцан" },
    description: {
      en: "Covered porches, entrances, steps and decking built to handle the seasons.",
      mn: "Улирлын хүндрэлийг даах дээвэртэй веранда, орц, шат, тавцан.",
    },
    details: {
      en: "A good porch or deck makes the entrance to your home more useful year-round. Paul builds solid structures with proper footings and drainage, designed to handle snow, frost and summer sun.",
      mn: "Сайн веранда, тавцан нь гэрийн орцыг жилийн турш ашигтай болгодог. Паул зөв суурь, ус зайлуулалттай, цас, хяруу, зуны нарыг тэсвэрлэх бат бөх байгууламж барина.",
    },
    includes: {
      en: ["Covered porches and entrances", "Decks and outdoor platforms", "Steps and railings", "Weather protection for timber"],
      mn: ["Дээвэртэй веранда, орц", "Тавцан, гадна талбай", "Шат, хашлага", "Модыг цаг агаараас хамгаалах"],
    },
  },
  {
    slug: "timber-cabins",
    category: "woodwork",
    title: { en: "Timber Cabins", mn: "Модон байшин" },
    description: {
      en: "Compact cabins and outbuildings from framing through to finishing.",
      mn: "Хүрээ угсралтаас эцсийн өнгөлгөө хүртэл жижиг модон байшин, туслах барилга.",
    },
    details: {
      en: "From a compact summer cabin to a garden outbuilding, Paul takes timber structures from frame to finish. He'll talk through size, use and budget first so the build fits how you'll actually use it.",
      mn: "Жижиг зуслангийн байшингаас эхлээд хашааны туслах барилга хүртэл Паул модон байгууламжийг хүрээнээс нь эцсийн өнгөлгөө хүртэл барина. Эхлээд хэмжээ, зориулалт, төсвийг ярилцаж, таны хэрэгцээнд тохируулна.",
    },
    includes: {
      en: ["Planning size and layout", "Framing and roofing", "Exterior cladding and interior finishing", "Doors, windows and porches"],
      mn: ["Хэмжээ, зохион байгуулалтыг төлөвлөх", "Хүрээ угсралт, дээвэр", "Гадна өнгөлгөө, дотор засал", "Хаалга, цонх, веранда"],
    },
  },
  {
    slug: "custom-built-ins",
    category: "woodwork",
    title: { en: "Custom Built-ins", mn: "Захиалгат тавилга" },
    description: {
      en: "Shelving, storage, benches and trim made to measure.",
      mn: "Хэмжээнд тааруулан хийсэн тавиур, хадгалах тавилга, сандал, хүрээ.",
    },
    details: {
      en: "Built-ins make the most of awkward corners and small rooms. Paul measures the space, suggests practical options and builds storage that fits exactly.",
      mn: "Захиалгат тавилга нь эвгүй булан, жижиг өрөөг бүрэн ашиглахад тусалдаг. Паул орон зайг хэмжиж, практик хувилбар санал болгоод яг тохирох тавилга хийнэ.",
    },
    includes: {
      en: ["Shelving and bookcases", "Wardrobes and storage units", "Benches and window seats", "Trim and finishing details"],
      mn: ["Тавиур, номын шүүгээ", "Хувцасны шүүгээ, хадгалах тавилга", "Сандал, цонхны суудал", "Хүрээ, эцсийн өнгөлгөө"],
    },
  },
  {
    slug: "interior-renovation",
    category: "renovation",
    title: { en: "Interior Renovation", mn: "Дотор засал" },
    description: {
      en: "Refresh a room or a whole floor. Layout, surfaces and finishing.",
      mn: "Нэг өрөө эсвэл бүтэн давхрыг шинэчлэх. Зохион байгуулалт, гадаргуу, өнгөлгөө.",
    },
    details: {
      en: "Whether it's one tired room or a whole floor, Paul helps plan what's worth changing and handles the work from preparation to final finish.",
      mn: "Нэг хуучирсан өрөө ч бай, бүтэн давхар ч бай, Паул юуг өөрчлөх нь зүйтэйг төлөвлөхөд тусалж, бэлтгэлээс эцсийн өнгөлгөө хүртэл ажлыг гүйцэтгэнэ.",
    },
    includes: {
      en: ["Planning the scope of work", "Walls, floors and ceilings", "Doors, trim and built-ins", "Final finishing and clean-up"],
      mn: ["Ажлын хүрээг төлөвлөх", "Хана, шал, тааз", "Хаалга, хүрээ, суурилуулсан тавилга", "Эцсийн өнгөлгөө, цэвэрлэгээ"],
    },
  },
  {
    slug: "exterior-finishing",
    category: "renovation",
    title: { en: "Exterior Finishing", mn: "Гадна засал" },
    description: {
      en: "Siding, trim, roof edges and facade work to protect and improve your home.",
      mn: "Гэрээ хамгаалж, сайжруулах фасад, хүрээ, дээврийн ирмэгийн ажил.",
    },
    details: {
      en: "The outside of your home takes the worst of the weather. Paul repairs and finishes siding, trim and roof edges to keep water and wind out and make the house look cared for.",
      mn: "Гэрийн гадна тал цаг агаарын хамгийн их нөлөөг авдаг. Паул гадна өнгөлгөө, хүрээ, дээврийн ирмэгийг засаж, ус салхи оруулахгүй, гэрийг цэвэрхэн харагдуулна.",
    },
    includes: {
      en: ["Siding and timber cladding", "Trim, fascia and roof edges", "Replacing damaged exterior boards", "Weatherproofing and sealing"],
      mn: ["Гадна өнгөлгөө, модон бүрээс", "Хүрээ, дээврийн ирмэг", "Гэмтсэн гадна банзыг солих", "Ус, салхинаас хамгаалах битүүмжлэл"],
    },
  },
  {
    slug: "kitchen-bath-updates",
    category: "renovation",
    title: { en: "Kitchen & Bath Updates", mn: "Гал тогоо, угаалгын өрөө" },
    description: {
      en: "Cabinet fitting, surfaces and finishing work for practical upgrades.",
      mn: "Шүүгээ суурилуулах, гадаргуу, практик шинэчлэлийн өнгөлгөөний ажил.",
    },
    details: {
      en: "Small updates in the kitchen or bathroom make a big difference day to day. Paul fits cabinets, shelving and surfaces and handles the finishing details around them.",
      mn: "Гал тогоо, угаалгын өрөөний жижиг шинэчлэл өдөр тутамд их ялгаа гаргадаг. Паул шүүгээ, тавиур, гадаргууг суулгаж, эргэн тойрны өнгөлгөөг хийнэ.",
    },
    includes: {
      en: ["Fitting cabinets and shelving", "Countertops and surfaces", "Trim and finishing details", "Small layout improvements"],
      mn: ["Шүүгээ, тавиур суурилуулах", "Ширээний тавцан, гадаргуу", "Хүрээ, өнгөлгөөний нарийн ажил", "Зохион байгуулалтын жижиг сайжруулалт"],
    },
  },
  {
    slug: "seasonal-winter-prep",
    category: "maintenance",
    title: { en: "Seasonal Winter Prep", mn: "Өвлийн бэлтгэл" },
    description: {
      en: "Sealing gaps, checking insulation and getting ready for UB winters.",
      mn: "Завсар битүүмжлэх, дулаалга шалгах, Улаанбаатарын өвөлд бэлдэх.",
    },
    details: {
      en: "UB winters are hard on homes. Before the cold sets in, Paul checks for drafts and weak spots and seals them up so your home stays warmer and uses less heat.",
      mn: "Улаанбаатарын өвөл гэрт хүнд тусдаг. Хүйтэн орохоос өмнө Паул салхи орох газар, сул хэсгийг шалгаж битүүмжилснээр гэр дулаан, халаалтын зардал бага байна.",
    },
    includes: {
      en: ["Finding and sealing drafts", "Checking insulation", "Door and window weatherstripping", "Exterior check before snow"],
      mn: ["Салхи орох газрыг олж битүүмжлэх", "Дулаалгыг шалгах", "Хаалга цонхны жийргэвч", "Цас орохоос өмнөх гадна үзлэг"],
    },
  },
  {
    slug: "property-check-ups",
    category: "maintenance",
    title: { en: "Property Check-ups", mn: "Байрны үзлэг" },
    description: {
      en: "Regular inspections and upkeep for homes, cabins and rental properties.",
      mn: "Байшин, зуслан, түрээсийн байранд тогтмол үзлэг, арчилгаа.",
    },
    details: {
      en: "Regular check-ups catch small problems before they become expensive ones. Useful for cabins you don't visit often and for rental properties.",
      mn: "Тогтмол үзлэг жижиг асуудлыг томрохоос нь өмнө илрүүлдэг. Байнга очдоггүй зуслан, түрээсийн байранд ялангуяа тохиромжтой.",
    },
    includes: {
      en: ["Walk-through inspection", "List of issues found", "Small repairs on the spot", "Seasonal or one-off visits"],
      mn: ["Бүрэн үзлэг", "Илэрсэн асуудлын жагсаалт", "Жижиг засварыг газар дээр нь", "Улирлын эсвэл нэг удаагийн очилт"],
    },
  },
  {
    slug: "wood-treatment-sealing",
    category: "maintenance",
    title: { en: "Wood Treatment & Sealing", mn: "Модыг хамгаалах боловсруулалт" },
    description: {
      en: "Staining, oiling and sealing timber to keep it looking good for years.",
      mn: "Модыг олон жил сайхан харагдуулахын тулд будах, тослох, лаклах.",
    },
    details: {
      en: "Timber exposed to sun and frost needs regular care. Paul cleans, prepares and treats wood surfaces so they stay protected and keep their colour.",
      mn: "Нар, хяруунд өртдөг мод тогтмол арчилгаа шаарддаг. Паул модон гадаргууг цэвэрлэж, бэлтгэж, боловсруулснаар хамгаалагдсан, өнгөө хадгалсан байна.",
    },
    includes: {
      en: ["Cleaning and sanding", "Staining and oiling", "Sealing exterior timber", "Porches, decks, cabins and cladding"],
      mn: ["Цэвэрлэх, зүлгэх", "Будах, тослох", "Гадна модыг лаклаж хамгаалах", "Веранда, тавцан, байшин, өнгөлгөө"],
    },
  },
];
