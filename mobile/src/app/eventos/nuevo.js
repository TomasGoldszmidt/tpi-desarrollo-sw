import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { getCategorias } from '../../api/categorias.js';
import { crearEvento } from '../../api/eventos.js';
import { useCarga } from '../../hooks/useCarga.js';
import { useAlturaTeclado } from '../../hooks/useAlturaTeclado.js';
import { CargaEncima, PantallaCarga } from '../../components/Carga.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { fechaArgentinaISO, formatDiaElegido, formatHoraElegida } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

const tipoVacio = () => ({ nombre: '', descripcion: '', precio: '', cupo: '' });

// Precio y cupo se cargan como texto; solo se aceptan dígitos (y una coma en el precio).
const precioValido = (texto) => /^\d+(,\d{1,2})?$/.test(texto);
const cupoValido = (texto) => /^\d+$/.test(texto) && Number(texto) >= 1;
const linkValido = (texto) => /^https?:\/\/\S+$/i.test(texto);
const lleno = (texto) => texto.trim() !== '';

// Qué le falta a un tipo de entrada, campo por campo (null si está bien). El cupo y el
// precio mal escritos se avisan siempre; los vacíos, solo después de tocar "Crear evento".
function erroresTipo(tipo, intentado) {
  const errores = {
    nombre: !lleno(tipo.nombre) ? 'Completá el nombre' : null,
    descripcion: !lleno(tipo.descripcion) ? 'Completá la descripción' : null,
    precio: tipo.precio === '' ? 'Completá el precio' : !precioValido(tipo.precio) ? 'Revisá el precio (ej: 15000 o 15000,50)' : null,
    cupo: tipo.cupo === '' ? 'Completá el cupo' : !cupoValido(tipo.cupo) ? 'El cupo tiene que ser al menos 1' : null,
  };
  if (!intentado) {
    errores.nombre = null;
    errores.descripcion = null;
    if (tipo.precio === '') errores.precio = null;
    if (tipo.cupo === '') errores.cupo = null;
  }
  return errores;
}

const tipoCompleto = (tipo) => Object.values(erroresTipo(tipo, true)).every((error) => error === null);

// Caso de uso 4: el organizador (usuario activo) crea un evento con varios tipos de
// entrada, cada uno con precio y cupo. Al crearlo, va al detalle del evento.
export default function NuevoEvento() {
  const { data: categorias, loading, error, recargar } = useCarga(getCategorias);
  const insets = useSafeAreaInsets();
  const alturaTeclado = useAlturaTeclado();
  const scroll = useRef(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [dia, setDia] = useState(null);
  const [hora, setHora] = useState(null);
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

  // Lo que falta, en el orden del formulario: la clave es el bloque al que se baja.
  const faltan = [
    ['nombre', !lleno(nombre)],
    ['descripcion', !lleno(descripcion)],
    ['categoria', categoriaId === null],
    ['fechaHora', !dia || !hora],
    ['lugar', !lleno(lugar)],
    ...tipos.map((tipo, i) => [`tipo${i}`, !tipoCompleto(tipo)]),
  ]
    .filter(([, falta]) => falta)
    .map(([clave]) => clave);
  const marcar = (falta) => intentado && falta;

  const registrar = (clave) => (event) => {
    const { y } = event.nativeEvent.layout;
    setPosiciones((anteriores) => (anteriores[clave] === y ? anteriores : { ...anteriores, [clave]: y }));
  };

  // Selectores nativos de Android. Lo que se elige se lee como hora local del celular
  // y se interpreta como hora argentina al armar la fecha.
  function elegirDia() {
    const hoy = new Date();
    DateTimePickerAndroid.open({
      mode: 'date',
      value: dia ? new Date(dia.anio, dia.mes, dia.dia) : hoy,
      minimumDate: hoy,
      onValueChange: (_event, fecha) =>
        setDia({ anio: fecha.getFullYear(), mes: fecha.getMonth(), dia: fecha.getDate() }),
    });
  }

  function elegirHora() {
    const valor = new Date();
    valor.setHours(hora?.hora ?? 20, hora?.minuto ?? 0, 0, 0);
    DateTimePickerAndroid.open({
      mode: 'time',
      is24Hour: true,
      value: valor,
      onValueChange: (_event, fecha) => setHora({ hora: fecha.getHours(), minuto: fecha.getMinutes() }),
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
    if (faltan.length > 0) {
      setIntentado(true);
      const y = posiciones[faltan[0]] ?? 0;
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
      // replace: al volver desde el detalle se llega a Mis eventos y no al formulario.
      router.replace(`/eventos/${evento.id}`);
    } catch (e) {
      setErrorCrear(e.message);
      setEnviando(false);
    }
  }

  const avisoPie = errorCrear ?? (intentado && faltan.length > 0 ? 'Completá los campos marcados en rojo' : null);

  return (
    <View style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      <ScrollView ref={scroll} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Crear evento</Text>

        <Campo etiqueta="Nombre" error={marcar(!lleno(nombre)) && 'Completá el nombre'} onLayout={registrar('nombre')}>
          <TextInput
            style={[styles.input, marcar(!lleno(nombre)) && styles.inputError]}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Meetup de JavaScript"
            placeholderTextColor={colors.textMuted}
          />
        </Campo>
        <Campo
          etiqueta="Descripción"
          error={marcar(!lleno(descripcion)) && 'Completá la descripción'}
          onLayout={registrar('descripcion')}
        >
          <TextInput
            style={[styles.input, styles.multilinea, marcar(!lleno(descripcion)) && styles.inputError]}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            placeholder="De qué se trata el evento"
            placeholderTextColor={colors.textMuted}
          />
        </Campo>

        <Campo etiqueta="Categoría" error={marcar(categoriaId === null) && 'Elegí una categoría'} onLayout={registrar('categoria')}>
          <View style={styles.chips}>
            {categorias.map((categoria) => {
              const elegida = categoria.id === categoriaId;
              return (
                <Pressable
                  key={categoria.id}
                  style={[styles.chip, elegida && styles.chipElegido, marcar(categoriaId === null) && styles.inputError]}
                  onPress={() => setCategoriaId(categoria.id)}
                >
                  <Text style={[styles.chipTexto, elegida && styles.chipTextoElegido]}>{categoria.nombre}</Text>
                </Pressable>
              );
            })}
          </View>
        </Campo>

        <View style={styles.fila} onLayout={registrar('fechaHora')}>
          <View style={styles.columnaAncha}>
            <Campo etiqueta="Fecha" error={marcar(!dia) && 'Elegí la fecha'}>
              <Selector texto={dia ? formatDiaElegido(dia) : 'Elegir'} onPress={elegirDia} conError={marcar(!dia)} />
            </Campo>
          </View>
          <View style={styles.columna}>
            <Campo etiqueta="Hora" error={marcar(!hora) && 'Elegí la hora'}>
              <Selector texto={hora ? formatHoraElegida(hora) : 'Elegir'} onPress={elegirHora} conError={marcar(!hora)} />
            </Campo>
          </View>
        </View>

        <Campo etiqueta="Lugar" error={marcar(!lleno(lugar)) && 'Completá el lugar'} onLayout={registrar('lugar')}>
          <TextInput
            style={[styles.input, marcar(!lleno(lugar)) && styles.inputError]}
            value={lugar}
            onChangeText={setLugar}
            placeholder="Ej: UTN FRBA, Medrano 951, CABA"
            placeholderTextColor={colors.textMuted}
          />
        </Campo>

        <Text style={styles.seccion}>
          Imágenes <Text style={styles.opcional}>(opcional)</Text>
        </Text>
        {multimedia.map((url, i) => (
          <View key={`${url}-${i}`} style={styles.link}>
            <Text style={styles.linkTexto} numberOfLines={1}>
              {url}
            </Text>
            <Pressable onPress={() => setMultimedia(multimedia.filter((_, j) => j !== i))} hitSlop={8}>
              <Text style={styles.quitar}>Quitar</Text>
            </Pressable>
          </View>
        ))}
        <View style={styles.fila}>
          <TextInput
            style={[styles.input, styles.columnaAncha]}
            value={link}
            onChangeText={setLink}
            placeholder="Link de una imagen"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Pressable
            style={[styles.botonChico, !linkValido(link.trim()) && styles.apagado]}
            onPress={agregarLink}
            disabled={!linkValido(link.trim())}
          >
            <Text style={styles.botonChicoTexto}>Agregar</Text>
          </Pressable>
        </View>
        {lleno(link) && !linkValido(link.trim()) ? (
          <Text style={styles.ayuda}>El link tiene que empezar con http:// o https://</Text>
        ) : null}

        <Text style={styles.seccion}>Tipos de entrada</Text>
        {tipos.map((tipo, i) => (
          <View key={i} onLayout={registrar(`tipo${i}`)}>
            <TipoEntradaForm
              numero={i + 1}
              tipo={tipo}
              errores={erroresTipo(tipo, intentado)}
              onChange={(campo, valor) => cambiarTipo(i, campo, valor)}
              onQuitar={i > 0 ? () => setTipos(tipos.filter((_, j) => j !== i)) : null}
            />
          </View>
        ))}
        <Pressable style={styles.agregar} onPress={() => setTipos([...tipos, tipoVacio()])}>
          <Ionicons name="add" size={18} color={colors.primaryText} />
          <Text style={styles.agregarTexto}>Agregar tipo de entrada</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: spacing.md + (alturaTeclado > 0 ? 0 : insets.bottom) }]}>
        {avisoPie ? <Text style={styles.error}>{avisoPie}</Text> : null}
        <Pressable style={[styles.boton, enviando && styles.apagado]} onPress={crear} disabled={enviando}>
          <Text style={styles.botonTexto}>Crear evento</Text>
        </Pressable>
      </View>
      {enviando ? <CargaEncima mensaje="Creando el evento…" /> : null}
    </View>
  );
}

function Campo({ etiqueta, error, onLayout, children }) {
  return (
    <View style={styles.campo} onLayout={onLayout}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      {children}
      {error ? <Text style={styles.ayuda}>{error}</Text> : null}
    </View>
  );
}

function Selector({ texto, onPress, conError }) {
  return (
    <Pressable style={[styles.input, styles.selector, conError && styles.inputError]} onPress={onPress}>
      <Text style={texto === 'Elegir' ? styles.placeholder : styles.valor}>{texto}</Text>
      <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

// Un tipo de entrada del formulario. onQuitar es null en el primero: siempre queda uno.
function TipoEntradaForm({ numero, tipo, errores, onChange, onQuitar }) {
  return (
    <View style={styles.tipo}>
      <View style={styles.tipoArriba}>
        <Text style={styles.tipoNumero}>Tipo {numero}</Text>
        {onQuitar ? (
          <Pressable onPress={onQuitar} hitSlop={8}>
            <Text style={styles.quitar}>Quitar</Text>
          </Pressable>
        ) : null}
      </View>
      <TextInput
        style={[styles.input, errores.nombre && styles.inputError]}
        value={tipo.nombre}
        onChangeText={(valor) => onChange('nombre', valor)}
        placeholder="Nombre (ej: General)"
        placeholderTextColor={colors.textMuted}
      />
      {errores.nombre ? <Text style={styles.ayuda}>{errores.nombre}</Text> : null}
      <TextInput
        style={[styles.input, styles.separado, errores.descripcion && styles.inputError]}
        value={tipo.descripcion}
        onChangeText={(valor) => onChange('descripcion', valor)}
        placeholder="Descripción (ej: Sin ubicación asignada)"
        placeholderTextColor={colors.textMuted}
      />
      {errores.descripcion ? <Text style={styles.ayuda}>{errores.descripcion}</Text> : null}
      <View style={[styles.fila, styles.separado]}>
        <View style={styles.columna}>
          <Text style={styles.etiqueta}>Precio</Text>
          <View style={[styles.input, styles.conPrefijo, errores.precio && styles.inputError]}>
            <Text style={styles.valor}>$ </Text>
            <TextInput
              style={styles.inputPelado}
              value={tipo.precio}
              onChangeText={(valor) => onChange('precio', valor.replace(/[^\d,]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
        <View style={styles.columna}>
          <Text style={styles.etiqueta}>Cupo</Text>
          <TextInput
            style={[styles.input, errores.cupo && styles.inputError]}
            value={tipo.cupo}
            onChangeText={(valor) => onChange('cupo', valor.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="100"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
      {errores.precio ? <Text style={styles.ayuda}>{errores.precio}</Text> : null}
      {errores.cupo ? <Text style={styles.ayuda}>{errores.cupo}</Text> : null}
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
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  campo: {
    marginTop: spacing.md,
  },
  etiqueta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.danger,
  },
  multilinea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
  valor: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  conPrefijo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
  },
  inputPelado: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipElegido: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  chipTextoElegido: {
    color: '#FFFFFF',
  },
  fila: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  columna: {
    flex: 1,
  },
  columnaAncha: {
    flex: 2,
  },
  seccion: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  opcional: {
    color: colors.textMuted,
    fontSize: fontSize.small,
    fontWeight: 'normal',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  linkTexto: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  quitar: {
    color: colors.danger,
    fontSize: fontSize.small,
  },
  ayuda: {
    color: colors.danger,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },
  botonChico: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonChicoTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  tipo: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tipoArriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  tipoNumero: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  separado: {
    marginTop: spacing.sm,
  },
  agregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: spacing.md,
  },
  agregarTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  pie: {
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  error: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.body,
    overflow: 'hidden',
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  apagado: {
    opacity: 0.5,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
