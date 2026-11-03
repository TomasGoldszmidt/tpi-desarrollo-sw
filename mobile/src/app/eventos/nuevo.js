import { useState } from 'react';
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

function tipoCompleto(tipo) {
  return lleno(tipo.nombre) && lleno(tipo.descripcion) && precioValido(tipo.precio) && cupoValido(tipo.cupo);
}

// Caso de uso 4: el organizador (usuario activo) crea un evento con varios tipos de
// entrada, cada uno con precio y cupo. Al crearlo, va al detalle del evento.
export default function NuevoEvento() {
  const { data: categorias, loading, error, recargar } = useCarga(getCategorias);
  const insets = useSafeAreaInsets();
  const alturaTeclado = useAlturaTeclado();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [dia, setDia] = useState(null);
  const [hora, setHora] = useState(null);
  const [lugar, setLugar] = useState('');
  const [multimedia, setMultimedia] = useState([]);
  const [link, setLink] = useState('');
  const [tipos, setTipos] = useState([tipoVacio()]);
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

  const completo =
    lleno(nombre) && lleno(descripcion) && categoriaId !== null && dia && hora && lleno(lugar) && tipos.every(tipoCompleto);

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
    setEnviando(true);
    setErrorCrear(null);
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

  return (
    <View style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Crear evento</Text>

        <Campo etiqueta="Nombre">
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Meetup de JavaScript" placeholderTextColor={colors.textMuted} />
        </Campo>
        <Campo etiqueta="Descripción">
          <TextInput
            style={[styles.input, styles.multilinea]}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            placeholder="De qué se trata el evento"
            placeholderTextColor={colors.textMuted}
          />
        </Campo>

        <Campo etiqueta="Categoría">
          <View style={styles.chips}>
            {categorias.map((categoria) => {
              const elegida = categoria.id === categoriaId;
              return (
                <Pressable
                  key={categoria.id}
                  style={[styles.chip, elegida && styles.chipElegido]}
                  onPress={() => setCategoriaId(categoria.id)}
                >
                  <Text style={[styles.chipTexto, elegida && styles.chipTextoElegido]}>{categoria.nombre}</Text>
                </Pressable>
              );
            })}
          </View>
        </Campo>

        <View style={styles.fila}>
          <View style={styles.columnaAncha}>
            <Campo etiqueta="Fecha">
              <Selector texto={dia ? formatDiaElegido(dia) : 'Elegir'} onPress={elegirDia} />
            </Campo>
          </View>
          <View style={styles.columna}>
            <Campo etiqueta="Hora">
              <Selector texto={hora ? formatHoraElegida(hora) : 'Elegir'} onPress={elegirHora} />
            </Campo>
          </View>
        </View>

        <Campo etiqueta="Lugar">
          <TextInput style={styles.input} value={lugar} onChangeText={setLugar} placeholder="Ej: UTN FRBA, Medrano 951, CABA" placeholderTextColor={colors.textMuted} />
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
          <TipoEntradaForm
            key={i}
            numero={i + 1}
            tipo={tipo}
            onChange={(campo, valor) => cambiarTipo(i, campo, valor)}
            onQuitar={i > 0 ? () => setTipos(tipos.filter((_, j) => j !== i)) : null}
          />
        ))}
        <Pressable style={styles.agregar} onPress={() => setTipos([...tipos, tipoVacio()])}>
          <Ionicons name="add" size={18} color={colors.primaryText} />
          <Text style={styles.agregarTexto}>Agregar tipo de entrada</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: spacing.md + (alturaTeclado > 0 ? 0 : insets.bottom) }]}>
        {errorCrear ? <Text style={styles.error}>{errorCrear}</Text> : null}
        <Pressable style={[styles.boton, (!completo || enviando) && styles.apagado]} onPress={crear} disabled={!completo || enviando}>
          <Text style={styles.botonTexto}>Crear evento</Text>
        </Pressable>
      </View>
      {enviando ? <CargaEncima mensaje="Creando el evento…" /> : null}
    </View>
  );
}

function Campo({ etiqueta, children }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      {children}
    </View>
  );
}

function Selector({ texto, onPress }) {
  return (
    <Pressable style={[styles.input, styles.selector]} onPress={onPress}>
      <Text style={texto === 'Elegir' ? styles.placeholder : styles.valor}>{texto}</Text>
      <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

// Un tipo de entrada del formulario. onQuitar es null en el primero: siempre queda uno.
function TipoEntradaForm({ numero, tipo, onChange, onQuitar }) {
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
        style={styles.input}
        value={tipo.nombre}
        onChangeText={(valor) => onChange('nombre', valor)}
        placeholder="Nombre (ej: General)"
        placeholderTextColor={colors.textMuted}
      />
      <TextInput
        style={[styles.input, styles.separado]}
        value={tipo.descripcion}
        onChangeText={(valor) => onChange('descripcion', valor)}
        placeholder="Descripción (ej: Sin ubicación asignada)"
        placeholderTextColor={colors.textMuted}
      />
      <View style={[styles.fila, styles.separado]}>
        <View style={styles.columna}>
          <Text style={styles.etiqueta}>Precio</Text>
          <View style={[styles.input, styles.conPrefijo]}>
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
            style={styles.input}
            value={tipo.cupo}
            onChangeText={(valor) => onChange('cupo', valor.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="100"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
      {tipo.cupo !== '' && !cupoValido(tipo.cupo) ? <Text style={styles.ayuda}>El cupo tiene que ser al menos 1</Text> : null}
      {tipo.precio !== '' && !precioValido(tipo.precio) ? <Text style={styles.ayuda}>Revisá el precio (ej: 15000 o 15000,50)</Text> : null}
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
