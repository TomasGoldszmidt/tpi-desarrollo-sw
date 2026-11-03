import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getEvento } from '../../api/eventos.js';
import { getReseniasOrganizador } from '../../api/usuarios.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { useCarga } from '../../hooks/useCarga.js';
import { Avatar } from '../../components/Avatar.js';
import { Estrellas } from '../../components/Estrellas.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { formatFecha, formatPrecio, formatPuntaje } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Detalle de un evento (caso de uso 10 y entrada al 12): datos, tipos de entrada con sus
// disponibles y el organizador con su puntaje y la reseña más reciente.
export default function DetalleEvento() {
  const { id } = useLocalSearchParams();
  const { usuario } = useUsuario();
  const pedir = useCallback(async () => {
    const evento = await getEvento(id);
    // Solo se piden las reseñas si hay alguna: la tarjeta muestra la más reciente.
    const resenias = evento.organizador.cantidadResenias > 0
      ? await getReseniasOrganizador(evento.organizador.id)
      : [];
    return { evento, resenias };
  }, [id]);
  const { data, loading, error, recargar } = useCarga(pedir);
  // El botón de comprar queda fijo abajo: se separa de la barra de gestos del celular.
  const insets = useSafeAreaInsets();

  if (error || !data) {
    return (
      <View style={styles.centrado}>
        <EstadoCarga loading={loading} error={error} onRetry={recargar} />
      </View>
    );
  }

  const { evento, resenias } = data;
  const agotado = evento.tiposEntrada.every((tipo) => tipo.disponibles === 0);
  // El backend no deja comprar en un evento propio: el organizador no ve el botón de compra.
  const esPropio = usuario?.id === evento.organizador.id;
  let textoBoton = 'Comprar entradas';
  if (esPropio) textoBoton = 'Es tu evento';
  else if (agotado) textoBoton = 'Agotado';

  return (
    <View style={styles.pantalla}>
      <ScrollView>
        <Galeria imagenes={evento.multimedia} />
        <View style={styles.contenido}>
          <Text style={styles.categoria}>{evento.categoria.nombre}</Text>
          <Text style={styles.nombre}>{evento.nombre}</Text>
          <View style={styles.dato}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.datoTexto}>{formatFecha(evento.fecha)}</Text>
          </View>
          <View style={styles.dato}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.datoTexto}>{evento.lugar}</Text>
          </View>
          <Text style={styles.descripcion}>{evento.descripcion}</Text>

          <Text style={styles.seccion}>Entradas</Text>
          {evento.tiposEntrada.map((tipo) => (
            <TipoEntradaFila key={tipo.id} tipo={tipo} />
          ))}

          <Text style={styles.seccion}>Organizador</Text>
          <OrganizadorCard organizador={evento.organizador} ultimaResenia={resenias[0]} />
        </View>
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: spacing.md + insets.bottom }]}>
        <Pressable
          style={[styles.comprar, (agotado || esPropio) && styles.comprarAgotado]}
          onPress={() => router.push(`/eventos/${evento.id}/comprar`)}
          disabled={agotado || esPropio}
        >
          <Text style={[styles.comprarTexto, (agotado || esPropio) && styles.comprarTextoAgotado]}>
            {textoBoton}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Las imágenes de multimedia, una por pantalla de ancho; con más de una se deslizan
// de costado y los puntos marcan cuál se ve.
function Galeria({ imagenes }) {
  const { width } = useWindowDimensions();
  const [actual, setActual] = useState(0);

  if (imagenes.length === 0) {
    return <View style={[styles.imagen, { width }]} />;
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActual(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {imagenes.map((uri) => (
          <Image key={uri} source={{ uri }} style={[styles.imagen, { width }]} />
        ))}
      </ScrollView>
      {imagenes.length > 1 ? (
        <View style={styles.puntos}>
          {imagenes.map((uri, i) => (
            <View key={uri} style={[styles.punto, i === actual && styles.puntoActual]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TipoEntradaFila({ tipo }) {
  const agotado = tipo.disponibles === 0;
  return (
    <View style={styles.tipo}>
      <View style={styles.tipoInfo}>
        <Text style={[styles.tipoNombre, agotado && styles.apagado]}>{tipo.nombre}</Text>
        <Text style={styles.tipoDescripcion}>{tipo.descripcion}</Text>
      </View>
      <View style={styles.tipoPrecio}>
        <Text style={[styles.precio, agotado && styles.apagado]}>{formatPrecio(tipo.precio)}</Text>
        {agotado ? (
          <Text style={styles.agotado}>Agotado</Text>
        ) : (
          <Text style={styles.disponibles}>{tipo.disponibles} disponibles</Text>
        )}
      </View>
    </View>
  );
}

// El organizador con su puntaje, la reseña más reciente y el enlace a todas sus reseñas.
// Sin reseñas no hay enlace, para no llevar a una pantalla vacía.
function OrganizadorCard({ organizador, ultimaResenia }) {
  const { puntaje, cantidadResenias } = organizador;
  return (
    <View style={styles.organizador}>
      <View style={styles.organizadorFila}>
        <Avatar usuario={organizador} size={40} />
        <View style={styles.tipoInfo}>
          <Text style={styles.organizadorNombre}>
            {organizador.nombre} {organizador.apellido}
          </Text>
          {puntaje === null ? (
            <Text style={styles.tipoDescripcion}>Todavía no tiene reseñas</Text>
          ) : (
            <Text style={styles.tipoDescripcion}>
              <Text style={styles.estrella}>★ {formatPuntaje(puntaje)}</Text> · {cantidadResenias}{' '}
              {cantidadResenias === 1 ? 'reseña' : 'reseñas'} de eventos anteriores
            </Text>
          )}
        </View>
      </View>

      {ultimaResenia ? (
        <View style={styles.muestra}>
          <Estrellas valor={ultimaResenia.puntuacion} size={12} />
          <Text style={styles.muestraTexto}>
            “{ultimaResenia.detalle}”{' '}
            <Text style={styles.muestraAutor}>
              — {ultimaResenia.comprador.nombre}, {ultimaResenia.evento.nombre}
            </Text>
          </Text>
        </View>
      ) : null}

      {cantidadResenias > 0 ? (
        <Pressable onPress={() => router.push(`/usuarios/${organizador.id}/resenias`)} hitSlop={8}>
          <Text style={styles.enlace}>
            {cantidadResenias === 1 ? 'Ver la reseña' : `Ver las ${cantidadResenias} reseñas`} ›
          </Text>
        </Pressable>
      ) : null}
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
  imagen: {
    height: 200,
    backgroundColor: colors.border,
  },
  puntos: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  puntoActual: {
    backgroundColor: '#FFFFFF',
  },
  contenido: {
    padding: spacing.lg,
  },
  categoria: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1EFE8',
    color: '#444441',
    borderRadius: 4,
    paddingHorizontal: 6,
    fontSize: 11,
  },
  nombre: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  dato: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  datoTexto: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  descripcion: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  seccion: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  tipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tipoInfo: {
    flex: 1,
  },
  tipoNombre: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  tipoDescripcion: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  tipoPrecio: {
    alignItems: 'flex-end',
  },
  precio: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  disponibles: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  agotado: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
    borderRadius: 4,
    paddingHorizontal: 6,
    fontSize: 11,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  apagado: {
    color: colors.textMuted,
  },
  organizador: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  organizadorFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  organizadorNombre: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  estrella: {
    color: '#BA7517',
  },
  muestra: {
    backgroundColor: '#F1EFE8',
    borderRadius: 8,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  muestraTexto: {
    color: colors.text,
    fontSize: fontSize.small,
    lineHeight: 18,
  },
  muestraAutor: {
    color: colors.textMuted,
  },
  enlace: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  pie: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  comprar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  comprarAgotado: {
    backgroundColor: colors.border,
  },
  comprarTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comprarTextoAgotado: {
    color: colors.textSecondary,
  },
});
