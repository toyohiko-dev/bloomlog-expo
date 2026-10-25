import {greenExpoMapAnchors} from './green-expo-map';
import reviewedPlaces from './green-expo-reviewed-bindings.json';
import pendingPavilionIds from './green-expo-pending-pavilion-ids.json';
import type {PlaceRegistry} from './place-registry';
import type {PlaceCoordinate} from './place-location';
// No event, source identity, UUID binding or illustration anchor is inferred from names.
// Populate only after source audit and existence checks; unresolved sources remain unbound.
// Publication and activation are approved ONLY for hanameguri. Other prepared places stay blocked.
export const greenExpoBindingsEnabled:boolean=true;
const approvedPavilionId='6d66171a-a4d3-5395-bdc0-e1b4121e9b60';
export const placeRegistry:PlaceRegistry = greenExpoBindingsEnabled?{events:[{id:'e60f2360-8147-4112-969a-00954596ceb6',name:'GREEN×EXPO2027',sourceNamespace:'green-expo-20261025'}],places:reviewedPlaces.filter(place=>place.pavilionId===approvedPavilionId),anchors:greenExpoMapAnchors.filter(anchor=>anchor.pavilionId===approvedPavilionId),pendingPavilionIds}:{events:[],places:[],anchors:[],pendingPavilionIds};
// Retained for compatibility with location-unit fixtures. Runtime uses reviewed event bindings.
export const placeCoordinates:readonly PlaceCoordinate[] = [];
