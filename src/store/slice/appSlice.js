import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    }
  }
});

export const { setUserInfo } = appSlice.actions;
export default appSlice.reducer;