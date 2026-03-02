
// AppContext.jsx


import { createContext, useContext, useReducer } from "react";
import { reducer, initialState } from "./reducer";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);