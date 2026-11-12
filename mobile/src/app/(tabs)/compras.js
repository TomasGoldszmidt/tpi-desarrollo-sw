import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getMisCompras } from '../../api/compras.js';
import { getUsuarios } from '../../api/usuarios.js';
import { useUsuario } from '../../context/UsuarioContext.js';
import { useCarga } from '../../hooks/useCarga.js';
import { CompraCard } from '../../components/CompraCard.js';
import { EstadoCarga } from '../../components/EstadoCarga.js';
import { FiltroEstados } from '../../components/FiltroEstados.js';
import { ORDEN_ESTADOS, estiloEstado } from '../../components/EstadoBadge.js';
import { Seccion } from '../../components/Seccion.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Caso de uso 1: las compras del usuario activo, con el estado bien diferenciado
// y los días que faltan para el evento si están confirmadas.
// La compra trae solo el id del organizador: los nombres, para el aviso de mensajes, salen de los usuarios.
async function pedirCompras() {
  const [{ resultados: compras }, usuarios] = await Promise.all([getMisCompras({ limite: 50 }), getUsuarios()]);
  return { compras: ordenarPorImportancia(compras), usuarios: new Map(usuarios.map((u) => [u.id, u])) };
}

// Las que todavía importan: hay que pagarlas o el evento está por venir.
const ESTADOS_ACTIVOS = ['PENDIENTE', 'CONFIRMADA'];

// Primero por estado, del más importante al menos (pendiente, confirmada, utilizada,
// cancelada, reembolsada), y dentro de cada estado por la fecha del evento:
// - pendientes y confirmadas: el evento más próximo primero; las de eventos que ya
//   pasaron van al final de su estado, la más reciente primero;
// - utilizadas, canceladas y reembolsadas: como historial, la más reciente primero.
function ordenarPorImportancia(compras) {
  const ahora = Date.now();
  return [...compras].sort((a, b) => {
    const porEstado = ORDEN_ESTADOS.indexOf(a.estado) - ORDEN_ESTADOS.indexOf(b.estado);
    if (porEstado !== 0) return porEstado;

    const fechaA = Date.parse(a.evento.fecha);
    const fechaB = Date.parse(b.evento.fecha);
    const porFecha = (() => {
      if (!ESTADOS_ACTIVOS.includes(a.estado)) return fechaB - fechaA;
      const pasoA = fechaA < ahora;
      const pasoB = fechaB < ahora;
      if (pasoA !== pasoB) return pasoA ? 1 : -1;
      return pasoA ? fechaB - fechaA : fechaA - fechaB;
    })();
    return porFecha || b.id - a.id;
  });
}

// El chat con el organizador, directo desde la lista (sin pasar por el detalle).
function abrirChat(compra, organizador) {
  router.push({
    pathname: '/compras/[id]/chat',
    params: {
      id: compra.id,
      evento: compra.evento.nombre,
      con: organizador ? `${organizador.nombre} ${organizador.apellido}` : 'el organizador',
    },
  });
}

export default function MisCompras() {
  const { usuario } = useUsuario();
  const { data, loading, error, recargar } = useCarga(pedirCompras);
  // Estado elegido en los chips (null = Todas). Se filtra en la app: GET /compras ya trae todas.
  // Se mantiene al recargar y al volver a la pestaña.
  const [estado, setEstado] = useState(null);

  // Se vuelve a pedir cada vez que se vuelve a la pestaña, así se ven los cambios
  // después de comprar, pagar o cancelar. La primera vez ya lo pide useCarga.
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

  return (
    <Seccion titulo="Mis compras">
      {error || !data ? (
        <EstadoCarga loading={loading} error={error} onRetry={recargar} mensaje="Cargando tus compras…" />
      ) : (
        <>
          {data.compras.length > 0 ? (
            <FiltroEstados compras={data.compras} elegido={estado} onElegir={setEstado} />
          ) : null}
          <FlatList
            data={estado === null ? data.compras : data.compras.filter((compra) => compra.estado === estado)}
            keyExtractor={(compra) => String(compra.id)}
            renderItem={({ item }) => (
              <CompraCard
                compra={item}
                usuario={usuario}
                organizador={data.usuarios.get(item.evento.organizadorId)}
                onPress={() => router.push(`/compras/${item.id}`)}
                onChat={() => abrirChat(item, data.usuarios.get(item.evento.organizadorId))}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={recargar} colors={[colors.primary]} />
            }
            // Se arma en cada render aunque la lista no esté vacía: con el filtro en Todas (estado null)
            // no hay estado del que leer el plural, así que ese caso va al vacío de "sin compras".
            ListEmptyComponent={
              estado !== null ? (
                // Hay compras, pero ninguna en el estado elegido (ej: se pagó la única pendiente).
                <View style={styles.vacio}>
                  <Text style={styles.vacioTitulo}>No tenés compras {estiloEstado(estado).enPlural}</Text>
                  <Text style={styles.vacioTexto}>Cambiá el filtro para ver las demás.</Text>
                  <Pressable style={styles.boton} onPress={() => setEstado(null)}>
                    <Text style={styles.botonTexto}>Ver todas</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.vacio}>
                  <Ionicons name="ticket-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.vacioTitulo}>Todavía no compraste entradas</Text>
                  <Text style={styles.vacioTexto}>Cuando compres, vas a ver acá el estado de cada compra.</Text>
                  <Pressable style={styles.boton} onPress={() => router.navigate('/catalogo')}>
                    <Text style={styles.botonTexto}>Explorar eventos</Text>
                  </Pressable>
                </View>
              )
            }
          />
        </>
      )}
    </Seccion>
  );
}

const styles = StyleSheet.create({
  vacio: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.xs,
  },
  vacioTitulo: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  vacioTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  boton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  botonTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
  },
});
