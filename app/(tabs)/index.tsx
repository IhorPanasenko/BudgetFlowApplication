import Button from '@/components/Button'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { auth } from '@/config/firebase'
import { colors } from '@/contansts/theme'
import { useAuth } from '@/context/authContext'
import { signOut } from 'firebase/auth'
import React from 'react'
import { StyleSheet } from 'react-native'

const Home = () => {
    const {user} = useAuth();
    console.log("User:", user);
    const handleLogout = async () => {
        await signOut(auth);
    }

  return (
    <ScreenWrapper>
      <Typo>Home</Typo>
      <Button onPress={handleLogout}>
        <Typo color={colors.black}>Logout</Typo>
      </Button>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({})