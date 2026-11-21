import { useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getEvento } from '../../api/eventos.js';
import { getReseniasOrganizador } from '../../api/usuarios.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { useCarga } from '../../hooks/useCarga.js';
import { useLayout } from '../../hooks/useLayout.js';
import { Boton } from '../../components/Boton.js';
import { BotonFavorito } from '../../components/BotonFavorito.js';
import { Etiqueta } from '../../components/Etiqueta.js';
import { Galeria } from '../../components/Galeria.js';
import { PantallaCarga } from '../../components/PantallaCarga.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { OrganizadorCard } from '../../components/detalleEvento/OrganizadorCard.js';
import { TipoEntradaFila } from '../../components/detalleEvento/TipoEntradaFila.js';
import { formatDiasRestantes, formatFecha, formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

const UN_DIA = 24 * 60 * 60 * 1000;
// Desde este ancho, las entradas van en una columna a la derecha.
const ANCHO_DOS_COLUMNAS = 720;

// Días de calendario hasta el evento (hoy es 0), como los calcula el backend para las compras.
function diasHasta(fecha, ahora) {
  const dia = (valor) => {
    const d = new Date(valor);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.round((dia(fecha) - dia(ahora)) / UN_DIA);
}

// Detalle de un evento (caso de uso 10 y entrada al 12): imágenes, datos, tipos de entrada con
// sus disponibles y el organizador con su puntaje y la reseña más reciente. El botón dice desde
// cuánto sale. En pantallas anchas las entradas y el botón quedan en una columna a la derecha.
export default function DetalleEvento() {
  const { id } = useLocalSearchParams();
  const { usuario } = useUsuario();
  const { width } = useLayout();
  const insets = useSafeAreaInsets();
  const pedir = useCallback(async () => {
    const evento = await getEvento(id);
    // Solo se pide la reseña más reciente, y solo si hay alguna: es la que muestra la tarjeta.
    const resenias = evento.organizador.cantidadResenias > 0
      ? (await getReseniasOrganizador(evento.organizador.id, { limite: 1 })).resultados
      : [];
    // Se calcula al pedirlo y no al dibujar, que tiene que dar siempre lo mismo.
    const ahora = Date.now();
    const realizado = new Date(evento.fecha).getTime() < ahora;
    return { evento, resenias, realizado, dias: realizado ? null : diasHasta(evento.fecha, ahora) };
  }, [id]);
  const { data, loading, error, recargar } = useCarga(pedir);

  // Al volver (ej: de una compra que falló por cupo) se vuelven a pedir las disponibles.
  const primeraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      recargar();
    }, [recargar]),
  );

  if (loading && !data) {
    return <PantallaCarga mensaje="Cargando el evento…" />;
  }
  if (error || !data) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  const { evento, resenias, realizado, dias } = data;
  const conCupo = evento.tiposEntrada.filter((tipo) => tipo.disponibles > 0);
  const agotado = conCupo.length === 0;
  // El backend no deja comprar en un evento propio: el organizador no ve el botón de compra.
  const esPropio = usuario?.id === evento.organizador.id;
  const sinCompra = agotado || esPropio || realizado;
  let textoBoton = `Comprar · desde ${formatPrecio(Math.min(...conCupo.map((tipo) => tipo.precio)))}`;
  if (realizado) textoBoton = 'Este evento ya se realizó';
  else if (esPropio) textoBoton = 'Es tu evento';
  else if (agotado) textoBoton = 'Agotado';
  const dosColumnas = width >= ANCHO_DOS_COLUMNAS;

  const comprar = (
    <Boton titulo={textoBoton} onPress={() => router.push(`/eventos/${evento.id}/comprar`)} disabled={sinCompra} />
  );
  const entradas = (
    <View style={[styles.caja, dosColumnas && styles.cajaLateral]}>
      {dosColumnas ? <Text style={styles.cajaTitulo}>Entradas</Text> : null}
      {evento.tiposEntrada.map((tipo, i) => (
        <TipoEntradaFila key={tipo.id} tipo={tipo} ultimo={i === evento.tiposEntrada.length - 1} />
      ))}
      {dosColumnas ? <View style={styles.comprarLateral}>{comprar}</View> : null}
    </View>
  );

  return (
    <View style={styles.pantalla}>
      <Stack.Screen options={{ headerRight: () => <BotonFavorito eventoId={evento.id} size={24} color={colors.text} /> }} />
      <ScrollView>
        <Galeria imagenes={evento.multimedia} />
        <View style={[styles.contenido, dosColumnas && styles.contenidoAncho]}>
          <View style={styles.principal}>
            <Text style={styles.categoria}>{evento.categoria.nombre}</Text>
            <Text style={styles.nombre}>{evento.nombre}</Text>
            <View style={styles.datoFila}>
              <View style={styles.dato}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.datoTexto}>{formatFecha(evento.fecha)}</Text>
              </View>
              {dias !== null ? (
                <Etiqueta texto={formatDiasRestantes(dias)} fondo={colors.primarySofter} color={colors.primaryText} />
              ) : null}
            </View>
            <View style={styles.dato}>
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.datoTexto, styles.flexible]}>{evento.lugar}</Text>
            </View>
            <Text style={styles.descripcion}>{evento.descripcion}</Text>

            {!dosColumnas ? (
              <>
                <Text style={styles.seccion}>Entradas</Text>
                {entradas}
              </>
            ) : null}

            <Text style={styles.seccion}>Organizador</Text>
            <OrganizadorCard organizador={evento.organizador} ultimaResenia={resenias[0]} />
          </View>
          {dosColumnas ? <View style={styles.lateral}>{entradas}</View> : null}
        </View>
      </ScrollView>

      {!dosColumnas ? <View style={[styles.pie, { paddingBottom: spacing.md + insets.bottom }]}>{comprar}</View> : null}
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
  contenidoAncho: {
    flexDirection: 'row',
    gap: spacing.xl + 4,
    padding: spacing.xl,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  principal: {
    flex: 1,
  },
  lateral: {
    width: 320,
  },
  flexible: {
    flex: 1,
  },
  categoria: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nombre: {
    color: colors.text,
    fontSize: fontSize.headline,
    fontWeight: 'bold',
    lineHeight: 30,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  datoFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.md,
    rowGap: spacing.xs,
    marginBottom: spacing.sm,
  },
  dato: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  datoTexto: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  descripcion: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  seccion: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  caja: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs,
  },
  cajaLateral: {
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  cajaTitulo: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  comprarLateral: {
    marginTop: spacing.sm,
  },
  pie: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.background,
  },
});
