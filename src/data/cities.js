/**
 * NAIJA LIFE — THE MAP
 * 12 cities · 45 districts · real venues.
 * Venues are written as "Name|emoji|type" and parsed at load.
 * lat/lng are real, so inter-city travel distance is real.
 */

const V = (spec) => {
  const [name, emoji, type, extra] = spec.split('|');
  return { name, emoji, type: type || 'misc', extra: extra || null };
};
const D = (id, name, zone, venues) => ({
  id, name, zone, venues: venues.map(V),
});

export const CITIES = [
  {
    id:'lagos', name:'Lagos', short:'LAG', state:'Lagos', region:'South West',
    tagline:'Lasgidi — no sleep, no nonsense', pop:16_500_000, lat:6.4550, lng:3.3841,
    costMult:1.55, wageMult:1.35, traffic:0.82, palette:'lagos',
    districts:[
      D('lagos-island','Lagos Island (CMS/Marina)','mid',[
        'Balogun Market|🧵|market','Idumota Market|🏬|market','Freedom Park|🎭|leisure',
        'CMS Motor Park|🚐|motorpark','Cathedral Church of Christ|⛪|church',
        'Central Mosque|🕌|mosque','Marina Bus Stop|🚏|motorpark','Eko Hospital|🏥|hospital',
        'Tafawa Balewa Square|🏟️|stadium','NITEL Building|🏢|office',
      ]),
      D('vi','Victoria Island','rich',[
        'Eko Hotel & Suites|🏨|hotel','Quilox|🪩|club','Silverbird Cinema|🎬|cinema',
        'Landmark Beach|🏖️|beach','Adeola Odeku Street|🏢|office','Zenith Bank HQ|🏦|bank',
        'Civic Centre|🏛️|govt','Ocean View Restaurant|🍽️|food','Muri Okunola Park|🌳|leisure',
        'Bonny Camp Barracks|🪖|govt',
      ]),
      D('lekki','Lekki Phase 1','rich',[
        'The Palms Mall|🛍️|mall','Nike Art Gallery|🎨|museum','Lekki Conservation Centre|🌉|leisure',
        'Elegushi Beach|🏖️|beach','Chevron Drive|⛽|fuel','Lekki Gardens Estate|🏡|estate',
        'Konga Tech Office|💻|techhub','Shoprite Lekki|🛒|mall','i-Fitness Lekki|🏋️|gym',
        'Balmoral Convention Center|🎪|leisure',
      ]),
      D('ikeja','Ikeja','mid',[
        'Computer Village|💻|techhub','Murtala Muhammed Airport|✈️|airport',
        'Allen Avenue|🏢|office','Ikeja City Mall|🛍️|mall','Oshodi Motor Park|🚐|motorpark',
        'Ikeja GRA|🏡|estate','LASU Ethnography Museum|🎨|museum','Shoprite Ikeja City Mall|🛒|mall',
        'Ojota BRT Terminal|🚌|motorpark','Mile 12 Market|🥬|market',
      ]),
      D('yaba','Yaba','mid',[
        'CcHub|💡|techhub','Yabatech|🎓|uni','UNILAG|🎓|uni','Sabo Street|🍲|food',
        'Herbert Macaulay Way|🏢|office','Iwaya Waterfront|🌊|leisure','Jibowu Bus Stop|🚏|motorpark',
        'Andela Campus|💻|techhub','Yaba Market|🧺|market','Sabotech Cybercafe|🖥️|techhub',
      ]),
      D('mushin','Mushin / Surulere','poor',[
        'Ojuwoye Market|🧺|market','National Stadium Surulere|🏟️|stadium','Mushin General Hospital|🏥|hospital',
        'Ogunlana Drive|🍲|food','Pepper Dem Garage|🚐|motorpark','Ilupeju Bypass|🏭|factory',
        'Agege Bread Factory|🍞|factory','Surulere Viewing Centre|📺|viewing','Ojuelegba|🚏|motorpark',
        'Mushin Police Station|🚓|police',
      ]),
    ],
  },
  {
    id:'abuja', name:'Abuja', short:'FCT', state:'Federal Capital Territory',
    region:'North Central', tagline:'The seat of power — and of contracts', pop:3_800_000,
    lat:9.0765, lng:7.3986, costMult:1.45, wageMult:1.30, traffic:0.35, palette:'abuja',
    districts:[
      D('central-area','Central Area','rich',[
        'Aso Rock Villa|🏛️|govt','National Assembly|🏛️|govt','National Mosque|🕌|mosque',
        'National Christian Centre|⛪|church','Eagle Square|🏟️|stadium','INEC HQ|🗳️|inec',
        'Central Bank of Nigeria|🏦|bank','NNPC Towers|🛢️|office','Federal Secretariat|🏢|govt',
        'Transcorp Hilton|🏨|hotel',
      ]),
      D('wuse','Wuse II','mid',[
        'Wuse Market|🧺|market','Silverbird Entertainment Centre|🎬|cinema','Sheraton Hotel|🏨|hotel',
        'Nigerian Turkish Hospital|🏥|hospital','Wuse Zone 4 Junction|🚏|motorpark',
        'Bank of Industry|🏦|bank','Chicken Republic Wuse|🍗|food','NIMC Enrolment Centre|🪪|nimc',
        'Banex Plaza|🛍️|mall','Berger Paints Showroom|🏭|factory',
      ]),
      D('maitama','Maitama','rich',[
        'Maitama District Hospital|🏥|hospital','Transcorp Hilton Suites|🏨|hotel',
        'Embassy Row|🏛️|govt','Ceddi Plaza|🛍️|mall','Maitama Amusement Park|🌳|leisure',
        'Nigerian Communications Commission|🏢|govt','Ibrahim Babangida Boulevard|🏢|office',
        'Ministry of Finance|🏛️|govt','Maitama Mosque|🕌|mosque','BluCabana|🪩|club',
      ]),
      D('garki','Garki / Gwagwalada','poor',[
        'Garki Model Market|🧺|market','Garki General Hospital|🏥|hospital',
        'Area 1 Motor Park|🚐|motorpark','University of Abuja|🎓|uni','Gwagwalada Council|🏛️|govt',
        'Garki Village|🏚️|home','Nnamdi Azikiwe Expressway|🚏|motorpark',
        'Federal Housing Estate Lugbe|🏡|estate','Garki Police Division|🚓|police','Utako Market|🛒|market',
      ]),
      D('jabi','Jabi / Wuye','mid',[
        'Jabi Lake Mall|🛍️|mall','Jabi Motor Park|🚐|motorpark','Wuye District|🏡|estate',
        'Nigerian Army Barracks|🪖|govt','Jabi Lake Park|🌳|leisure','Kubwa Express|🚏|motorpark',
        'Cubana Lounge|🪩|club','Nigeria Police Academy Annex|🚓|police',
        'Wuse Zone 6 Clubs|🎭|club','Abuja Technology Village|💻|techhub',
      ]),
    ],
  },
  {
    id:'ph', name:'Port Harcourt', short:'PH', state:'Rivers', region:'South South',
    tagline:'Garden City — oil money and bole', pop:2_900_000, lat:4.8156, lng:7.0498,
    costMult:1.20, wageMult:1.18, traffic:0.55, palette:'ph',
    districts:[
      D('ph-gra','GRA Phase 1','rich',[
        'Port Harcourt Club|🪩|club','Hotel Presidential|🏨|hotel','Bole & Fish Republic|🍠|food',
        'Pleasure Park|🌳|leisure','Shell RA|🛢️|office','Mile One Flyover|🚏|motorpark',
        'Genesis Restaurant|🍽️|food','Gra Phase 2 Estate|🏡|estate','Silverbird PH|🎬|cinema',
        'Rivers State Secretariat|🏛️|govt',
      ]),
      D('diobu','Diobu (Mile 1–4)','poor',[
        'Mile 1 Market|🧺|market','Creek Road Motor Park|🚐|motorpark','Diobu Yard|🏚️|home',
        'Blood of Jesus Ministry|⛪|church','Diobu Police Station|🚓|police',
        'Rumuokoro Junction|🚏|motorpark','Water Lines|🏚️|home','Berger Bus Stop|🚐|motorpark',
        'Ogbunabali Shrine|🗿|shrine','Mile 3 Park|🍲|food',
      ]),
      D('trans-amadi','Trans Amadi','industrial',[
        'Port Harcourt Refinery|🛢️|refinery','Trans Amadi Industrial Layout|🏭|factory',
        'Nigerian Breweries PH|🏭|factory','Onne Sea Port|⛵|seaport','Eleme Petrochemical|🛢️|factory',
        'Abuloma Jetty|⛵|seaport','Indorama|🏭|factory','Rainbow Supermarket|🛒|mall',
        'Trans Amadi Clinic|🏥|hospital','PH International Airport|✈️|airport',
      ]),
      D('choba','Choba / Uniport','campus',[
        'University of Port Harcourt|🎓|uni','Choba Market|🧺|market','Uniport East Gate|🚏|motorpark',
        'Aluu Community|🏚️|home','Choba Bypass|🍲|food','Uniport Teaching Hospital|🏥|hospital',
        'Delta Park|🌳|leisure','Choba Cybercafe|🖥️|techhub','Eliozu Roundabout|🚏|motorpark',
        'Rumuosi|🏡|estate','Uniport Mosque|🕌|mosque',
      ]),
    ],
  },
  {
    id:'ibadan', name:'Ibadan', short:'IB', state:'Oyo', region:'South West',
    tagline:'Amala capital of the world', pop:4_200_000, lat:7.3775, lng:3.9470,
    costMult:0.70, wageMult:0.72, traffic:0.48, palette:'ibadan',
    districts:[
      D('dugbe','Dugbe / Ring Road','mid',[
        'Cocoa House|🏢|office','Dugbe Market|🧺|market','Ibadan Ring Road|🚏|motorpark',
        'Liberty Stadium|🏟️|stadium','Ibadan Recreation Club|🎭|club','Kola Daisi University|🎓|uni',
        'CAC Oke Bola|⛪|church','Gbagi Market|🛍️|market','OYO State Secretariat|🏛️|govt',
        'Iyaganku High Court|⚖️|court',
      ]),
      D('bodija','Bodija','mid',[
        'Bodija Market|🥩|market','University College Hospital (UCH)|🏥|hospital',
        'University of Ibadan|🎓|uni','Agodi Gardens|🌳|leisure','Bodija Abattoir|🥩|market',
        'Samonda|🏡|estate','Ibadan Golf Club|⛳|leisure','Bodija Motor Park|🚐|motorpark',
        'Awotan Apostolic|⛪|church','Challenge Roundabout|🚏|motorpark',
      ]),
      D('iwo-road','Iwo Road / Challenge','poor',[
        'Iwo Road Interchange|🚐|motorpark','Challenge Market|🧺|market','Amala Shitta|🍲|food',
        'Ojoo Motor Park|🚐|motorpark','Apata Junction|🚏|motorpark','Aleshinloye Market|🛒|market',
        'Ibadan North LGA|🏛️|govt','Odo Ona|🏚️|home','Adeoyo Hospital|🏥|hospital',
        'Sango-Ojoo BRT Lane|🚌|motorpark',
      ]),
      D('sango','Sango / Agodi GRA','mid',[
        'Sango Police Station|🚓|police','Agodi GRA|🏡|estate','Ibadan Polytechnic|🎓|uni',
        'Sango Market|🧺|market','The Polytechnic Ibadan Radio|📻|media','Oke-Ado|🏢|office',
        'Agodi Correctional Centre|🚔|prison','Beere Roundabout|🚏|motorpark',
        'Mapo Hall|🏛️|govt','Molete Baptist|⛪|church',
      ]),
    ],
  },
  {
    id:'kano', name:'Kano', short:'KN', state:'Kano', region:'North West',
    tagline:'Centre of commerce — and of centuries', pop:4_600_000, lat:12.0022, lng:8.5920,
    costMult:0.66, wageMult:0.68, traffic:0.44, palette:'kano',
    districts:[
      D('kano-muni','Kano Municipal','mid',[
        'Kurmi Market|🧵|market','Gidan Makama Museum|🎨|museum','Emir of Kano Palace|🏛️|govt',
        'Kano Central Mosque|🕌|mosque','Sabon Gari Roundabout|🚏|motorpark',
        'Kano State High Court|⚖️|court','Kano Zoo|🌳|leisure','Ado Bayero Mall|🛍️|mall',
        'Kofar Mata Dye Pits|🎨|museum','Murtala Muhammad Hospital|🏥|hospital',
      ]),
      D('sabon-gari','Sabon Gari','poor',[
        'Sabon Gari Market|🧺|market','Sabon Gari Motor Park|🚐|motorpark',
        'St. Louis Catholic Church|⛪|church','Sabon Gari Hotel|🏨|hotel',
        'Kano Textile Mills|🏭|factory','Fagge Ward|🏚️|home','Yan Kura|🧺|market',
        'BUK Old Campus Gate|🎓|uni','Sabon Gari Police Station|🚓|police',
        'Sabon Gari Suya Spot|🍢|food',
      ]),
      D('buk','BUK Road / Tarauni','campus',[
        'Bayero University Kano|🎓|uni','Aminu Kano Teaching Hospital|🏥|hospital',
        'BUK New Campus Gate|🚏|motorpark','Tarauni Mini Market|🛒|market',
        'Kano University of Science & Tech|🎓|uni','Gyadi Gyadi|🏡|estate',
        'BUK Mosque|🕌|mosque','Tarauni LGA Secretariat|🏛️|govt',
        'Kano State Polytechnic|🎓|uni','Naibawa Cybercafe|🖥️|techhub',
      ]),
      D('nassarawa','Nassarawa / Fagge','poor',[
        'Nassarawa Mini Market|🧺|market','Kano Refinery|🛢️|refinery',
        'Nassarawa Motor Park|🚐|motorpark','Fagge Ta Kudu|🏚️|home',
        'Kano Electricity Distribution Co|💡|govt','Yankaba Market|🧺|market',
        'Nassarawa Hospital|🏥|hospital','Ungogo LGA|🏛️|govt',
        'Kano Freight Terminal|📦|factory','Sharada Industrial Estate|🏭|factory',
      ]),
    ],
  },
  {
    id:'enugu', name:'Enugu', short:'EN', state:'Enugu', region:'South East',
    tagline:'Coal City — Igbo enterprise HQ', pop:1_100_000, lat:6.4400, lng:7.4943,
    costMult:0.72, wageMult:0.75, traffic:0.40, palette:'enugu',
    districts:[
      D('independence','Independence Layout','rich',[
        'Enugu State Government House|🏛️|govt','Nike Lake Road|🌳|leisure',
        'Presidential Hotel|🏨|hotel','Independence Layout Market|🛒|market',
        'Ebeano Tunnel|🚏|motorpark','Enugu Golf Club|⛳|leisure',
        'Silverbird Enugu|🎬|cinema','Iva Valley Hotel|🪩|club','Holy Ghost Cathedral|⛪|church',
        'Enugu Electricity District|💡|govt',
      ]),
      D('ogbete','Ogbete Main Market','mid',[
        'Ogbete Main Market|🧵|market','Ogbete Motor Park|🚐|motorpark',
        'Upper Chime Avenue|🏢|office','Enugu Central Police|🚓|police',
        'Ogbete Fuel Depot|⛽|fuel','Artisan Market|🔧|market','Coal Camp|🏚️|home',
        'Ogui Road|🛍️|market','First Bank Ogbete|🏦|bank','New Haven Junction|🚏|motorpark',
      ]),
      D('new-haven','New Haven','mid',[
        'New Haven Market|🛒|market','Enugu State University of Science & Tech|🎓|uni',
        'UNEC (ESUT Business School)|🎓|uni','New Heaven Motor Park|🚐|motorpark',
        'Park Lane Hospital|🏥|hospital','Zodiac Junction|🚏|motorpark',
        'Roban Stores|🛍️|mall','New Haven Police Post|🚓|police',
        'Emene Industrial Layout|🏭|factory','Akanu Ibiam Airport|✈️|airport',
      ]),
      D('nsukka','Nsukka','campus',[
        'University of Nigeria Nsukka|🎓|uni','Nsukka Central Market|🧺|market',
        'Nnamdi Azikiwe Library|📚|uni','UNN Medical Centre|🏥|hospital',
        'Nsukka Motor Park|🚐|motorpark','Odenigbo Hall|🏚️|home',
        'Nsukka Catholic Cathedral|⛪|church','Opi Junction|🚏|motorpark',
        'UNN Cybercafe|🖥️|techhub','Nsukka High Court|⚖️|court',
      ]),
    ],
  },
  {
    id:'benin', name:'Benin City', short:'BN', state:'Edo', region:'South South',
    tagline:'The ancient city — bronze and beads', pop:1_800_000, lat:6.3350, lng:5.6037,
    costMult:0.74, wageMult:0.70, traffic:0.45, palette:'benin',
    districts:[
      D('ring-road','Ring Road','mid',[
        'Oba Market|🧺|market','Benin City Ring Road|🚏|motorpark',
        'Oba of Benin Palace|🏛️|govt','Benin Museum|🎨|museum',
        'University of Benin Teaching Hospital|🏥|hospital','New Benin Market|🛒|market',
        'Edo State Secretariat|🏛️|govt','Ring Road Police|🚓|police',
        'Isekhere Street|🏢|office','Bendel Brewery|🏭|factory',
      ]),
      D('uselu','Uselu / Ekpoma Road','poor',[
        'Uselu Market|🧺|market','Uselu Motor Park|🚐|motorpark',
        'Uselu Community|🏚️|home','Iyoba Primary School|🎓|school',
        'Oregbeni Quarters|🏚️|home','Uselu Police Post|🚓|police',
        'Egor LGA|🏛️|govt','Uselu Bypass|🍲|food','Ikpoba Hill|🏚️|home','Ekehuan Road|🚏|motorpark',
      ]),
      D('sapele-road','Sapele Road / GRA','mid',[
        'Benin GRA|🏡|estate','Sapele Road Junction|🚏|motorpark',
        'University of Benin|🎓|uni','Sapele Road Market|🛒|market',
        'Central Hospital Benin|🏥|hospital','Ogba Zoo|🌳|leisure',
        'Iyaro|⛪|church','Airport Road|✈️|airport','Edo State High Court|⚖️|court',
        'Waterboard|🚰|govt',
      ]),
    ],
  },
  {
    id:'onitsha', name:'Onitsha', short:'ON', state:'Anambra', region:'South East',
    tagline:'The Japan of Africa — everything is sold here', pop:1_400_000, lat:6.1420, lng:6.7849,
    costMult:0.78, wageMult:0.80, traffic:0.62, palette:'onitsha',
    districts:[
      D('main-market','Ochanja / Main Market','mid',[
        'Onitsha Main Market|🧵|market','Ochanja Market|🛍️|market','Bridge Head Market|🧺|market',
        'Upper Iweka Motor Park|🚐|motorpark','Onitsha Fuel Depot|⛽|fuel',
        'Ochanja Relief Market|🛒|market','Nkpor Industrial|🏭|factory',
        'Onitsha General Hospital|🏥|hospital','Upper Iweka Police|🚓|police',
        'Niger Bridge|🌉|leisure',
      ]),
      D('fegge','Fegge / Awka Road','poor',[
        'Fegge Market|🧺|market','Awka Road Junction|🚏|motorpark',
        'Fegge Community|🏚️|home','Awada Obosi|🏭|factory','Fegge Police Post|🚓|police',
        'Okpoko|🏚️|home','Omagba Phase 1|🏡|estate','Nkpor Market|🛒|market',
        'Anambra State Water Board|🚰|govt','Fegge Viewing Centre|📺|viewing',
      ]),
      D('ogidi','Ogidi / Nkpor','poor',[
        'Ogidi Market|🧺|market','Nkpor Junction|🚏|motorpark','Ogidi Community|🏚️|home',
        'Anambra Motor Manufacturing|🏭|factory','Ogidi Police|🚓|police',
        'Ogidi Community School|🎓|school','Umuchu Road|🍲|food',
        'Obosi Market|🛒|market','Idemili LGA|🏛️|govt','Ogidi Catholic Church|⛪|church',
      ]),
    ],
  },
  {
    id:'jos', name:'Jos', short:'JOS', state:'Plateau', region:'North Central',
    tagline:'Cold weather, warm people', pop:1_000_000, lat:9.8965, lng:8.8583,
    costMult:0.62, wageMult:0.60, traffic:0.30, palette:'jos',
    districts:[
      D('terminus','Terminus / Bauchi Road','mid',[
        'Terminus Market|🧺|market','Jos Museum|🎨|museum','Bauchi Road Motor Park|🚐|motorpark',
        'Jos Main Market|🛍️|market','Plateau State Secretariat|🏛️|govt',
        'Jos University Teaching Hospital|🏥|hospital','Hill Station Hotel|🏨|hotel',
        'ECWA Gospel Church|⛪|church','Jos Central Mosque|🕌|mosque','Terminus Roundabout|🚏|motorpark',
      ]),
      D('rayfield','Rayfield','rich',[
        'Rayfield Resort|🌳|leisure','Plateau Government House|🏛️|govt',
        'Rayfield Golf Club|⛳|leisure','Wildlife Park Jos|🌳|leisure',
        'Rayfield Estate|🏡|estate','Solomon Lar Amusement Park|🎪|leisure',
        'Nigerian Film Corporation|🎬|media','Police Staff College|🚓|police',
        'Rayfield Junction|🚏|motorpark','Highlands Hotel|🏨|hotel',
      ]),
      D('bukuru','Bukuru / Anglo Jos','poor',[
        'Bukuru Market|🧺|market','Anglo Jos|🏭|factory','Bukuru Motor Park|🚐|motorpark',
        'Plateau State Polytechnic|🎓|uni','University of Jos|🎓|uni',
        'Bukuru Low Cost|🏚️|home','Zaramaganda Mine Ponds|⛏️|factory',
        'Bukuru Police Station|🚓|police','Vom Veterinary Institute|🏭|factory',
        'Bukuru Irish Potato Depot|🥔|market',
      ]),
    ],
  },
  {
    id:'calabar', name:'Calabar', short:'CLB', state:'Cross River', region:'South South',
    tagline:'Carnival city — the cleanest in Nigeria', pop:900_000, lat:4.9757, lng:8.3417,
    costMult:0.70, wageMult:0.62, traffic:0.28, palette:'calabar',
    districts:[
      D('watt','Watt Market / Calabar South','mid',[
        'Watt Market|🧺|market','Calabar Motor Park|🚐|motorpark','Marian Road|🏢|office',
        'Cross River State Secretariat|🏛️|govt','Calabar Central Mosque|🕌|mosque',
        'Duke Town Cathedral|⛪|church','Watt Market Police Post|🚓|police',
        'Mbukpa|🏚️|home','Calabar General Hospital|🏥|hospital','Bogobiri|🍲|food',
      ]),
      D('marina','Marina Resort','rich',[
        'Marina Resort|🌳|leisure','Calabar Slave History Museum|🎨|museum',
        'Tinapa Resort|🛍️|mall','Cross River State Museum|🎨|museum',
        'Calabar Marriott|🏨|hotel','Millennium Park|🌳|leisure',
        'State Housing Estate|🏡|estate','Calabar Golf Club|⛳|leisure',
        'Nigerian Navy Base|🪖|govt','Paradise Beach|🏖️|beach',
      ]),
      D('ekorinim','Ekorinim / Akim','poor',[
        'Ekorinim Market|🧺|market','Akim Market|🛒|market','Ekorinim Motor Park|🚐|motorpark',
        'University of Calabar|🎓|uni','Calabar Municipal Council|🏛️|govt',
        'Ekorinim Community|🏚️|home','Unical Teaching Hospital|🏥|hospital',
        'Ekorinim Police Post|🚓|police','Nasarawa Calabar|🏚️|home','Ekorinim Viewing Centre|📺|viewing',
      ]),
    ],
  },
  {
    id:'kaduna', name:'Kaduna', short:'KD', state:'Kaduna', region:'North West',
    tagline:'Crocodile city of the North', pop:1_900_000, lat:10.5264, lng:7.4383,
    costMult:0.68, wageMult:0.66, traffic:0.38, palette:'kaduna',
    districts:[
      D('kawo','Kawo / Barnawa','mid',[
        'Kawo Motor Park|🚐|motorpark','Barnawa Market|🧺|market',
        'Kaduna Refinery|🛢️|refinery','Kawo Community|🏚️|home',
        'Kaduna State Secretariat|🏛️|govt','Kaduna Central Mosque|🕌|mosque',
        'St. Gerald Catholic Cathedral|⛪|church','Barnawa Estate|🏡|estate',
        'Kaduna International Airport|✈️|airport','Kawo Police Station|🚓|police',
      ]),
      D('malali','Malali / Unguwan Sarki','rich',[
        'Malali GRA|🏡|estate','Unguwan Sarki Baracks|🪖|govt',
        'Kaduna Golf Club|⛳|leisure','Kaduna Club|🎭|club',
        'Sir Kashim Ibrahim House|🏛️|govt','Malali Mini Market|🛒|market',
        'Barau Dikko Hospital|🏥|hospital','Kaduna Business School|🎓|uni',
        'Malali Motor Park|🚏|motorpark','Murtala Square|🏟️|stadium',
      ]),
      D('sabo','Sabo / Tudun Wada','poor',[
        'Sabo Market|🧺|market','Tudun Wada|🏚️|home','Sabo Motor Park|🚐|motorpark',
        'Kaduna Polytechnic|🎓|uni','Sabo Police Division|🚓|police',
        'Kaduna Textile|🏭|factory','Kaduna Central Market|🛍️|market',
        'Tudun Wada Mosque|🕌|mosque','Sabo Hospital|🏥|hospital',
        'Kaduna Correctional Centre|🚔|prison',
      ]),
    ],
  },
  {
    id:'maiduguri', name:'Maiduguri', short:'MDG', state:'Borno', region:'North East',
    tagline:'Home of peace — against all odds', pop:1_200_000, lat:11.8311, lng:13.1510,
    costMult:0.60, wageMult:0.58, traffic:0.26, palette:'maiduguri',
    districts:[
      D('monday','Monday Market','mid',[
        'Monday Market|🧺|market','Maiduguri Motor Park|🚐|motorpark',
        'Shehu of Borno Palace|🏛️|govt','Borno State Secretariat|🏛️|govt',
        'Maiduguri Central Mosque|🕌|mosque','Post Office Area|🏢|office',
        'State Specialist Hospital|🏥|hospital','Monday Market Police|🚓|police',
        'Gwange Ward|🏚️|home','Baga Road Market|🛒|market',
      ]),
      D('gra-mdg','GRA Maiduguri','rich',[
        'Borno GRA|🏡|estate','Maiduguri International Hotel|🏨|hotel',
        'Maimalari Barracks|🪖|govt','El-Kanemi Warriors Stadium|🏟️|stadium',
        'GRA Mini Market|🛒|market','Borno State High Court|⚖️|court',
        'Federal Government College|🎓|school','GRA Police Station|🚓|police',
        'Shehu Sanda Kyarimi Park|🌳|leisure','Custom Area|🏢|office',
      ]),
      D('unimaid','Unimaid / Bolori','campus',[
        'University of Maiduguri|🎓|uni','Unimaid Teaching Hospital|🏥|hospital',
        'Bolori Market|🧺|market','Unimaid Gate Motor Park|🚐|motorpark',
        'Ramad Poly|🎓|uni','Bolori Community|🏚️|home',
        'Unimaid Mosque|🕌|mosque','Damboa Road Park|🚏|motorpark',
        'Unimaid Cybercafe|🖥️|techhub','Bolori Police Post|🚓|police',
      ]),
    ],
  },
];

/* ───────── derived indexes ───────── */
export const CITY_BY_ID = Object.fromEntries(CITIES.map(c => [c.id, c]));
export const DISTRICTS = [];
export const DISTRICT_BY_ID = {};
export const VENUES = [];
export const VENUE_BY_ID = {};

for (const city of CITIES) {
  for (const d of city.districts) {
    const full = { ...d, cityId: city.id, cityName: city.name, costMult: city.costMult, wageMult: city.wageMult };
    DISTRICTS.push(full);
    DISTRICT_BY_ID[city.id + ':' + d.id] = full;
    // deterministic seed per district so every client generates the same street map
    let h = 2166136261;
    for (const ch of city.id + '/' + d.id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    full.seed = h >>> 0;
    d.venues.forEach((v, i) => {
      const id = `${city.id}:${d.id}:v${i}`;
      const venue = { ...v, id, cityId: city.id, districtId: city.id + ':' + d.id, cityName: city.name, districtName: d.name, zone: d.zone };
      VENUES.push(venue); VENUE_BY_ID[id] = venue;
    });
  }
}

export const cityOf = (districtId) => CITY_BY_ID[districtId.split(':')[0]];
export const districtOf = (districtId) => DISTRICT_BY_ID[districtId];

/* Haversine — real distance between two cities */
export function distanceKm(a, b) {
  const R = 6371, toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

/* ───────── venue type catalogue (drives actions + icons) ───────── */
export const VENUE_TYPES = {
  food:{ label:'Buka / Restaurant', colour:'#f59e0b', acts:['eat','chat','work'] },
  club:{ label:'Club / Lounge', colour:'#a855f7', acts:['party','eat','chat','work'], entry:3_000 },
  market:{ label:'Market', colour:'#f97316', acts:['shop','sell','chat','work'], entry:0 },
  mall:{ label:'Mall / Supermarket', colour:'#0ea5e9', acts:['shop','chat','work'], entry:0 },
  bank:{ label:'Bank', colour:'#2563eb', acts:['bank','chat','work'], entry:0 },
  school:{ label:'School', colour:'#16a34a', acts:['study','chat','work'] },
  uni:{ label:'University / Poly', colour:'#15803d', acts:['study','chat','work'] },
  hospital:{ label:'Hospital', colour:'#ef4444', acts:['hospital','chat','work'] },
  pharmacy:{ label:'Pharmacy', colour:'#f43f5e', acts:['pharmacy','chat'] },
  church:{ label:'Church', colour:'#8b5cf6', acts:['worship','chat'] },
  mosque:{ label:'Mosque', colour:'#10b981', acts:['worship','chat'] },
  shrine:{ label:'Traditional shrine', colour:'#b45309', acts:['worship','chat'] },
  govt:{ label:'Government office', colour:'#64748b', acts:['gov','chat','work'] },
  inec:{ label:'INEC / Election', colour:'#64748b', acts:['inec','chat'] },
  police:{ label:'Police station', colour:'#1d4ed8', acts:['police','chat'] },
  court:{ label:'Court', colour:'#7c3aed', acts:['court','chat'] },
  prison:{ label:'Correctional centre', colour:'#334155', acts:['prison','chat'] },
  nimc:{ label:'NIMC centre', colour:'#0891b2', acts:['nimc','chat'] },
  office:{ label:'Office', colour:'#475569', acts:['work','chat'] },
  techhub:{ label:'Tech hub', colour:'#06b6d4', acts:['work','study','chat','gig'] },
  motorpark:{ label:'Motor park', colour:'#eab308', acts:['travel','chat','work'], entry:0 },
  airport:{ label:'Airport', colour:'#38bdf8', acts:['travel','chat'], entry:0 },
  seaport:{ label:'Sea port', colour:'#0ea5e9', acts:['travel','work','chat'] },
  beach:{ label:'Beach', colour:'#22d3ee', acts:['relax','chat','party'], entry:2_000 },
  stadium:{ label:'Stadium', colour:'#84cc16', acts:['watch','chat','work'], entry:1_500 },
  cinema:{ label:'Cinema', colour:'#6366f1', acts:['relax','chat'], entry:4_500 },
  museum:{ label:'Museum / Gallery', colour:'#a16207', acts:['relax','chat'], entry:1_500 },
  leisure:{ label:'Leisure', colour:'#84cc16', acts:['relax','chat','party'], entry:1_000 },
  home:{ label:'Residential', colour:'#94a3b8', acts:['chat'] },
  estate:{ label:'Estate', colour:'#64748b', acts:['housing','chat'] },
  fuel:{ label:'Filling station', colour:'#dc2626', acts:['fuel','chat','work'] },
  hotel:{ label:'Hotel', colour:'#0d9488', acts:['rest','chat','work'], entry:18_000 },
  salon:{ label:'Salon / Barbing', colour:'#ec4899', acts:['groom','chat','work'] },
  gym:{ label:'Gym', colour:'#f97316', acts:['gym','chat','work'], entry:8_000 },
  media:{ label:'Media house', colour:'#e11d48', acts:['work','chat','gig'] },
  casino:{ label:'Betting shop', colour:'#ca8a04', acts:['bet','chat'] },
  refinery:{ label:'Refinery', colour:'#7c2d12', acts:['work','chat'] },
  factory:{ label:'Factory / Industry', colour:'#57534e', acts:['work','chat'] },
  viewing:{ label:'Viewing centre', colour:'#facc15', acts:['watch','chat'], entry:500 },
  misc:{ label:'Place', colour:'#94a3b8', acts:['chat'] },
};
