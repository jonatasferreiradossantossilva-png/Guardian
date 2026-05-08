import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../../firebase/config';
import { CARAPICUIBA_SCHOOLS } from './carapicuiba-seed';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('Iniciando semeadura de escolas no Firestore de produção...');
  const schoolsCol = collection(db, 'schools');
  const snapshot = await getDocs(schoolsCol);
  
  if (snapshot.empty) {
    console.log('Coleção de escolas vazia. Semeando escolas padrão da base INEP (Carapicuíba)...');
    for (const school of CARAPICUIBA_SCHOOLS) {
      await setDoc(doc(db, 'schools', school.id), school);
      console.log(`Escola semeada com sucesso: ${school.name}`);
    }
    console.log('Semeadura concluída com êxito!');
  } else {
    console.log(`A coleção de escolas já possui ${snapshot.size} registros. Nenhuma ação necessária.`);
  }
}

seed().catch(err => {
  console.error('Erro ao semear escolas:', err);
});
