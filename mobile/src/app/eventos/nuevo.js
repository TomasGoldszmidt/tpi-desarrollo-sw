import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { getCategorias } from '../../api/categorias.js';
import { crearEvento } from '../../api/eventos.js';
import { useAvisos } from '../../context/AvisosContext.js';
import { useCarga } from '../../hooks/useCarga.js';
import { useAlturaTeclado } from '../../hooks/useAlturaTeclado.js';
import { useLayout } from '../../hooks/useLayout.js';
import { Boton } from '../../components/Boton.js';
import { CargaEncima } from '../../components/CargaEncima.js';
import { PantallaCarga } from '../../components/PantallaCarga.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { Aviso } from '../../components/Aviso.js';
import { CampoEvento } from '../../components/nuevoEvento/CampoEvento.js';
import { Paso } from '../../components/nuevoEvento/Paso.js';
import { Selector } from '../../components/nuevoEvento/Selector.js';
import { TipoEntradaForm } from '../../components/nuevoEvento/TipoEntradaForm.js';
import { estilosFormulario } from '../../components/nuevoEvento/estilos.js';
import { LARGOS } from '../../components/nuevoEvento/largos.js';
import { fechaArgentinaISO, formatDiaElegido, formatHoraElegida } from '../../format.js';
import { colors, fontSize, spacing, TOQUE_MINIMO } from '../../theme.js';

const tipoVacio = () => ({ nombre: '', descripcion: '', precio: '', cupo: '' });

// Precio y cupo se cargan como texto; solo se aceptan dígitos (y una coma en el precio).
const precioValido = (texto) => /^\d+(,\d{1,2})?$/.test(texto);
const cupoValido = (texto) => /^\d+$/.test(texto) && Number(texto) >= 1;
const linkValido = (texto) => /^https?:\/\/\S+$/i.test(texto);
const lleno = (texto) => texto.trim() !== '';
const clave = (texto) => texto.trim().toLowerCase();

// Qué le falta a un tipo de entrada, campo por campo (null si está bien). El cupo y el
// precio mal escritos y los nombres repetidos se avisan siempre; los vacíos, solo después
// de tocar "Crear evento". repetido: el nombre que ya tiene otro tipo anterior.
function erroresTipo(tipo, intentado, repetido = null) {
  const errores = {
    nombre: !lleno(tipo.nombre) ? 'Completá el nombre' : repetido ? `Ya hay un tipo de entrada llamado “${repetido}”` : null,
    descripcion: !lleno(tipo.descripcion) ? 'Completá la descripción' : null,
    precio: tipo.precio === '' ? 'Completá el precio' : !precioValido(tipo.precio) ? 'Revisá el precio (ej: 15000 o 15000,50)' : null,
    cupo: tipo.cupo === '' ? 'Completá el cupo' : !cupoValido(tipo.cupo) ? 'El cupo tiene que ser al menos 1' : null,
  };
  if (!intentado) {
    if (!lleno(tipo.nombre)) errores.nombre = null;
    errores.descripcion = null;
    if (tipo.precio === '') errores.precio = null;
    if (tipo.cupo === '') errores.cupo = null;
  }
  return errores;
}

// Para cada tipo, el nombre del tipo anterior que se llama igual (o null).
function repetidos(tipos) {
  return tipos.map((tipo, i) => {
    if (!lleno(tipo.nombre)) return null;
    const anterior = tipos.slice(0, i).find((otro) => clave(otro.nombre) === clave(tipo.nombre));
    return anterior ? anterior.nombre.trim() : null;
  });
}

// ¿La fecha y hora elegidas ya pasaron? Se calcula al elegirlas (no al dibujar).
function yaPaso(dia, hora) {
  if (!dia || !hora) return false;
  return new Date(fechaArgentinaISO(dia, hora)).getTime() <= Date.now();
}

// Caso de uso 4: el organizador (usuario activo) crea un evento con varios tipos de
// entrada, cada uno con precio y cupo, en cuatro bloques numerados. Los errores se avisan
// en el mismo campo (también la hora que ya pasó y los tipos repetidos), y el pie resume
// cuántos tipos y lugares hay. En tablet horizontal las entradas van a la derecha.
export default function NuevoEvento() {
  const { data: categorias, loading, error, recargar } = useCarga(getCategorias);
  const avisos = useAvisos();
  const insets = useSafeAreaInsets();
  const alturaTeclado = useAlturaTeclado();
  const { esAncho } = useLayout();
  const scroll = useRef(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [dia, setDia] = useState(null);
  const [hora, setHora] = useState(null);
  const [horaPasada, setHoraPasada] = useState(false);
  const [lugar, setLugar] = useState('');
  const [multimedia, setMultimedia] = useState([]);
  const [link, setLink] = useState('');
  const [tipos, setTipos] = useState([tipoVacio()]);
  // Se marcan los campos que faltan recién después de tocar "Crear evento".
  const [intentado, setIntentado] = useState(false);
  // Posición vertical de cada bloque del formulario, para bajar hasta el primero que falta.
  const [posiciones, setPosiciones] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorCrear, setErrorCrear] = useState(null);

  if (loading && !categorias) {
    return <PantallaCarga mensaje="Cargando el formulario…" />;
  }
  if (error || !categorias) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  const nombresRepetidos = repetidos(tipos);

  // Lo que falta, en el orden del formulario: la clave es el bloque al que se baja.
  const faltan = [
    ['nombre', !lleno(nombre)],
    ['descripcion', !lleno(descripcion)],
    ['categoria', categoriaId === null],
    ['fechaHora', !dia || !hora || horaPasada],
    ['lugar', !lleno(lugar)],
    ...tipos.map((tipo, i) => [`tipo${i}`, Object.values(erroresTipo(tipo, true, nombresRepetidos[i])).some(Boolean)]),
  ]
    .filter(([, falta]) => falta)
    .map(([bloque]) => bloque);
  const marcar = (falta) => intentado && falta;

  const lugares = tipos.reduce((total, tipo) => total + (cupoValido(tipo.cupo) ? Number(tipo.cupo) : 0), 0);

  const registrar = (bloque) => (event) => {
    const { y } = event.nativeEvent.layout;
    setPosiciones((anteriores) => (anteriores[bloque] === y ? anteriores : { ...anteriores, [bloque]: y }));
  };

  // Selectores nativos de Android. Lo que se elige se lee como hora local del celular
  // y se interpreta como hora argentina al armar la fecha.
  function elegirDia() {
    const hoy = new Date();
    DateTimePickerAndroid.open({
      mode: 'date',
      value: dia ? new Date(dia.anio, dia.mes, dia.dia) : hoy,
      minimumDate: hoy,
      onValueChange: (_event, fecha) => {
        const nuevo = { anio: fecha.getFullYear(), mes: fecha.getMonth(), dia: fecha.getDate() };
        setDia(nuevo);
        setHoraPasada(yaPaso(nuevo, hora));
      },
    });
  }

  function elegirHora() {
    const valor = new Date();
    valor.setHours(hora?.hora ?? 20, hora?.minuto ?? 0, 0, 0);
    DateTimePickerAndroid.open({
      mode: 'time',
      is24Hour: true,
      value: valor,
      onValueChange: (_event, fecha) => {
        const nueva = { hora: fecha.getHours(), minuto: fecha.getMinutes() };
        setHora(nueva);
        setHoraPasada(yaPaso(dia, nueva));
      },
    });
  }

  function agregarLink() {
    setMultimedia([...multimedia, link.trim()]);
    setLink('');
  }

  function cambiarTipo(indice, campo, valor) {
    setTipos(tipos.map((tipo, i) => (i === indice ? { ...tipo, [campo]: valor } : tipo)));
  }

  async function crear() {
    setErrorCrear(null);
    // Justo antes de mandar se vuelve a revisar la hora: pudo pasar mientras se completaba.
    const pasada = yaPaso(dia, hora);
    setHoraPasada(pasada);
    if (faltan.length > 0 || pasada) {
      setIntentado(true);
      const y = posiciones[faltan[0] ?? 'fechaHora'] ?? 0;
      scroll.current?.scrollTo({ y: Math.max(0, y - spacing.lg), animated: true });
      return;
    }

    setEnviando(true);
    try {
      const evento = await crearEvento({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        lugar: lugar.trim(),
        categoriaId,
        fecha: fechaArgentinaISO(dia, hora),
        multimedia,
        tiposEntrada: tipos.map((tipo) => ({
          nombre: tipo.nombre.trim(),
          descripcion: tipo.descripcion.trim(),
          precio: Number(tipo.precio.replace(',', '.')),
          cupo: Number(tipo.cupo),
        })),
      });
      avisos.mostrar('Creaste el evento. Ya está en el catálogo.');
      // replace: al volver desde el detalle se llega a Mis eventos y no al formulario.
      router.replace(`/eventos/${evento.id}`);
    } catch (e) {
      setErrorCrear(e.message);
      setEnviando(false);
    }
  }

  const errorFechaHora = marcar(!dia) ? 'Elegí la fecha' : marcar(!hora) ? 'Elegí la hora' : horaPasada ? 'Esa fecha y hora ya pasaron: elegí una futura' : null;

  const datos = (
    <>
      <Paso numero={1} titulo="Datos del evento" />
      <CampoEvento etiqueta="Nombre" error={marcar(!lleno(nombre)) && 'Completá el nombre'} onLayout={registrar('nombre')}>
        <TextInput
          style={[estilosFormulario.input, marcar(!lleno(nombre)) && estilosFormulario.inputError]}
          value={nombre}
          onChangeText={setNombre}
          maxLength={LARGOS.nombre}
          placeholder="Ej: Meetup de JavaScript"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Nombre del evento"
        />
      </CampoEvento>
      <CampoEvento etiqueta="Descripción" error={marcar(!lleno(descripcion)) && 'Completá la descripción'} onLayout={registrar('descripcion')}>
        <TextInput
          style={[estilosFormulario.input, styles.multilinea, marcar(!lleno(descripcion)) && estilosFormulario.inputError]}
          value={descripcion}
          onChangeText={setDescripcion}
          maxLength={LARGOS.descripcion}
          multiline
          placeholder="De qué se trata el evento"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Descripción"
        />
      </CampoEvento>
      <CampoEvento etiqueta="Categoría" error={marcar(categoriaId === null) && 'Elegí una categoría'} onLayout={registrar('categoria')}>
        <View style={styles.chips}>
          {categorias.map((categoria) => {
            const elegida = categoria.id === categoriaId;
            return (
              <Pressable
                key={categoria.id}
                style={[styles.chip, elegida && styles.chipElegido, marcar(categoriaId === null) && estilosFormulario.inputError]}
                onPress={() => setCategoriaId(categoria.id)}
                hitSlop={4}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegida }}
              >
                <Text style={[styles.chipTexto, elegida && styles.chipTextoElegido]}>{categoria.nombre}</Text>
              </Pressable>
            );
          })}
        </View>
      </CampoEvento>

      <Paso numero={2} titulo="Fecha y lugar" />
      <View onLayout={registrar('fechaHora')}>
        <View style={estilosFormulario.fila}>
          <View style={styles.columnaAncha}>
            <CampoEvento etiqueta="Fecha">
              <Selector
                icono="calendar-outline"
                texto={dia ? formatDiaElegido(dia) : 'Elegir'}
                onPress={elegirDia}
                conError={marcar(!dia) || horaPasada}
              />
            </CampoEvento>
          </View>
          <View style={estilosFormulario.columna}>
            <CampoEvento etiqueta="Hora">
              <Selector
                icono="time-outline"
                texto={hora ? formatHoraElegida(hora) : 'Elegir'}
                onPress={elegirHora}
                conError={marcar(!hora) || horaPasada}
              />
            </CampoEvento>
          </View>
        </View>
        {errorFechaHora ? <Text style={estilosFormulario.error}>{errorFechaHora}</Text> : null}
      </View>
      <CampoEvento etiqueta="Lugar" error={marcar(!lleno(lugar)) && 'Completá el lugar'} onLayout={registrar('lugar')}>
        <TextInput
          style={[estilosFormulario.input, marcar(!lleno(lugar)) && estilosFormulario.inputError]}
          value={lugar}
          onChangeText={setLugar}
          maxLength={LARGOS.lugar}
          placeholder="Ej: UTN FRBA, Medrano 951, CABA"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Lugar"
        />
      </CampoEvento>
    </>
  );

  const imagenes = (
    <>
      <Paso numero={3} titulo="Imágenes" opcional />
      {multimedia.length > 0 ? (
        <View style={styles.miniaturas}>
          {multimedia.map((url, i) => (
            <View key={`${url}-${i}`}>
              <Image source={{ uri: url }} style={styles.miniatura} accessibilityLabel={`Imagen ${i + 1}`} />
              <Pressable
                style={styles.quitarImagen}
                onPress={() => setMultimedia(multimedia.filter((_, j) => j !== i))}
                accessibilityRole="button"
                accessibilityLabel={`Quitar la imagen ${i + 1}`}
              >
                <View style={styles.quitarCirculo}>
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <View style={estilosFormulario.fila}>
        <TextInput
          style={[estilosFormulario.input, styles.columnaAncha]}
          value={link}
          onChangeText={setLink}
          placeholder="Pegá el link de una imagen"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="url"
          accessibilityLabel="Link de una imagen"
        />
        <Boton titulo="Agregar" variante="secundario" chico onPress={agregarLink} disabled={!linkValido(link.trim())} style={styles.agregarLink} />
      </View>
      {lleno(link) && !linkValido(link.trim()) ? <Text style={estilosFormulario.error}>El link tiene que empezar con http:// o https://</Text> : null}
    </>
  );

  const entradas = (
    <>
      <Paso numero={4} titulo="Entradas" />
      {tipos.map((tipo, i) => (
        <View key={i} onLayout={registrar(`tipo${i}`)}>
          <TipoEntradaForm
            numero={i + 1}
            tipo={tipo}
            errores={erroresTipo(tipo, intentado, nombresRepetidos[i])}
            onChange={(campo, valor) => cambiarTipo(i, campo, valor)}
            onQuitar={i > 0 ? () => setTipos(tipos.filter((_, j) => j !== i)) : null}
          />
        </View>
      ))}
      <Boton titulo="Agregar tipo de entrada" variante="secundario" icono="add" onPress={() => setTipos([...tipos, tipoVacio()])} />
    </>
  );

  const pie = (
    <View style={[styles.pie, { paddingBottom: spacing.md + (alturaTeclado > 0 || esAncho ? 0 : insets.bottom) }]}>
      <Aviso>{errorCrear ?? (intentado && (faltan.length > 0 || horaPasada) ? 'Revisá los campos marcados en rojo.' : null)}</Aviso>
      <Text style={styles.resumen}>
        {tipos.length} {tipos.length === 1 ? 'tipo de entrada' : 'tipos de entrada'} · {lugares} {lugares === 1 ? 'lugar' : 'lugares'}
      </Text>
      <Boton titulo="Crear evento" onPress={crear} cargando={enviando} />
    </View>
  );

  if (esAncho) {
    return (
      <View style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
        <ScrollView ref={scroll} contentContainerStyle={styles.contenidoAncho} keyboardShouldPersistTaps="handled">
          <View style={styles.columnaIzquierda}>
            <Text style={styles.titulo}>Crear evento</Text>
            {datos}
          </View>
          <View style={styles.columnaDerecha}>
            {imagenes}
            {entradas}
            <View style={styles.pieAncho}>{pie}</View>
          </View>
        </ScrollView>
        {enviando ? <CargaEncima mensaje="Creando el evento…" /> : null}
      </View>
    );
  }

  return (
    <View style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      <ScrollView ref={scroll} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Crear evento</Text>
        {datos}
        {imagenes}
        {entradas}
      </ScrollView>
      {pie}
      {enviando ? <CargaEncima mensaje="Creando el evento…" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  contenidoAncho: {
    flexDirection: 'row',
    gap: spacing.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  columnaIzquierda: {
    flex: 1,
  },
  columnaDerecha: {
    width: 440,
    paddingTop: spacing.xxl + spacing.sm,
  },
  pieAncho: {
    marginTop: spacing.xl,
    borderRadius: 14,
    overflow: 'hidden',
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.headline,
    fontWeight: 'bold',
  },
  multilinea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  chipElegido: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    color: colors.text,
    fontSize: fontSize.small,
  },
  chipTextoElegido: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  columnaAncha: {
    flex: 2,
  },
  miniaturas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  miniatura: {
    width: 112,
    height: 63,
    borderRadius: 10,
    backgroundColor: colors.borderSoft,
  },
  quitarImagen: {
    position: 'absolute',
    top: -14,
    right: -14,
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitarCirculo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agregarLink: {
    alignSelf: 'auto',
    minHeight: 48,
  },
  pie: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  resumen: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    textAlign: 'center',
  },
});
