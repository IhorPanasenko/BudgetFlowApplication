import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/contansts/theme";
import { useAuth } from "@/context/authContext";
import { useCategories } from "@/hooks/useCategories";
import { CategoryType } from "@/types";
import { verticalScale } from "@/utilts/styling";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const CategoryListModal = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { categories, loading } = useCategories(user?.uid, true);

  const openCategory = (category: CategoryType) => {
    router.push({
      pathname: "/(modals)/categoryModal",
      params: { id: category.id },
    });
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: CategoryType;
    index: number;
  }) => {
    const IconComponent = item.icon
      ? Icons[item.icon as keyof typeof Icons]
      : undefined;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 150)
          .springify()
          .damping(14)}
      >
        <TouchableOpacity
          style={styles.categoryRow}
          onPress={() => openCategory(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
            {IconComponent ? (
              <IconComponent size={22} color={colors.white} weight="fill" />
            ) : null}
          </View>
          <Typo size={16} style={{ flex: 1 }}>
            {item.label}
          </Typo>
          <Typo size={14} color={colors.neutral400} style={{ marginRight: 8 }}>
            {item.type}
          </Typo>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Header
            title="Categories"
            leftIcon={<BackButton />}
            style={{ marginBottom: spacingY._10 }}
          />
        </View>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id!}
          renderItem={({ item, index }) => renderItem({ item, index })}
          contentContainerStyle={{ paddingVertical: spacingY._10 }}
          ListEmptyComponent={
            <Typo
              color={colors.neutral400}
              style={{ textAlign: "center", marginTop: 30 }}
            >
              You haven't created a category yet.
            </Typo>
          }
          refreshing={loading}
        />
        <Button
          style={styles.floatingButton}
          onPress={() => router.push("/(modals)/categoryModal")}
        >
          <Icons.Plus
            size={verticalScale(24)}
            color={colors.black}
            weight="bold"
          />
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default CategoryListModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacingX._15,
    backgroundColor: colors.neutral900,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacingY._10,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    elevation: 0,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30),
  },
});
