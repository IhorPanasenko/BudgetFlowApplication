import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { firestore } from "@/config/firebase";
import { colors, spacingX, spacingY } from "@/contansts/theme";
import { useAuth } from "@/context/authContext";
import {
  createUpdateCategory,
  deleteCategory,
} from "@/services/categoryService";
import { CategoryType } from "@/types";
import { scale, verticalScale } from "@/utilts/styling";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const ICON_OPTIONS = [
  "Heart",
  "ShoppingCart",
  "House",
  "Lightbulb",
  "Car",
  "FilmStrip",
  "ForkKnife",
  "PiggyBank",
];
const TYPE_OPTIONS = ["Expense", "Income"];
const COLOR_OPTIONS = [
  "#4B5563",
  "#075985",
  "#ca8a04",
  "#b45309",
  "#be185d",
  "#16a34a",
  "#0e7490",
  "#f59e42",
  "#f43f5e",
  "#6366f1",
  "#fbbf24",
  "#22d3ee",
  "#84cc16",
  "#a21caf",
  "#f87171",
  "#facc15",
];

const CategoryModal = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const categoryId = params.id as string | undefined;

  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [bgColor, setBgColor] = useState("#4B5563");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (categoryId) {
      setIsEditing(true);
      (async () => {
        const ref = doc(firestore, "categories", categoryId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setLabel(data.label);
          setIcon(data.icon);
          setBgColor(data.bgColor);
          setType(data.type);
        }
      })();
    }
  }, [categoryId]);

  useEffect(() => {
  if (params.selectedIcon) {
    setIcon(params.selectedIcon as string);
    router.setParams({ selectedIcon: undefined });
  }
}, [params.selectedIcon]);

  const iconOptions = useMemo(() => {
    if (!icon) return ICON_OPTIONS;
    return [icon, ...ICON_OPTIONS.filter(i => i !== icon)];
  }, [icon]);

  const onDelete = async () => {
    if (!categoryId) return;
    setLoading(true);
    const res = await deleteCategory(categoryId);
    setLoading(false);
    if (res.success) {
      router.back();
    } else {
      Alert.alert("Wallet", res.msg);
    }
  };

  const deleteAlert = () => {
    Alert.alert("Confirm", "Are you sure you want to delete this category?", [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Delete"),
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => onDelete(),
        style: "destructive",
      },
    ]);
  };

  const onSubmit = async () => {
    if (!label.trim() || !type || !icon || !bgColor) {
      Alert.alert("Category", "Please, fill all the fields");
      return;
    }

    const data: CategoryType = {
      id: categoryId ?? undefined,
      label: label.trim(),
      value: label.trim(),
      type: type as "Expense" | "Income",
      icon,
      bgColor,
      uid: user?.uid,
    };

    setLoading(true);
    const res = await createUpdateCategory(data);
    setLoading(false);

    if (res.success) {
      router.replace("/(modals)/categoryListModal");
    } else {
      Alert.alert("Category", res.msg || "Something went wrong");
    }
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={categoryId ? "Edit Category" : "New Category"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Name</Typo>
            <Input
              placeholder="Category name"
              value={label}
              onChangeText={(value) => {
                setLabel(value);
              }}
            />
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Type</Typo>
            <View style={styles.row}>
              {TYPE_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    type === t && { backgroundColor: colors.primary },
                    isEditing && { opacity: type === t ? 1 : 0.5 },
                  ]}
                  onPress={() => setType(t)}
                  disabled={isEditing}
                >
                  <Typo color={type === t ? colors.white : colors.neutral200}>
                    {t}
                  </Typo>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Icon</Typo>
            <View style={styles.row}>
              {iconOptions.map((iconName) => {
                const IconComponent = Icons[iconName as keyof typeof Icons];
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.iconBtn,
                      icon === iconName && { borderColor: colors.primary },
                    ]}
                    onPress={() => setIcon(iconName)}
                  >
                    <IconComponent
                      size={24}
                      color={
                        icon === iconName ? colors.primary : colors.neutral300
                      }
                    />
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[
                  styles.iconBtn,
                  { borderColor: colors.primary, borderStyle: "dashed" },
                ]}
                onPress={() => router.push({
                  pathname: "/(modals)/iconPickerModal",
                  params: { from: "categoryModal" }
                })}
              >
                <Icons.MagnifyingGlass size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Background Color</Typo>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((colorOption) => (
                <TouchableOpacity
                  key={colorOption}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: colorOption },
                    bgColor === colorOption && styles.selectedColorCircle,
                  ]}
                  onPress={() => setBgColor(colorOption)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        {categoryId && !loading && (
          <Button
            onPress={deleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
          >
            <Icons.Trash
              color={colors.white}
              size={verticalScale(24)}
              weight="bold"
            />
          </Button>
        )}
        <Button loading={loading} onPress={onSubmit} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={"700"}>
            {categoryId ? "Update Category" : "Add Category"}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default CategoryModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
    padding: spacingX._15,
    paddingTop: spacingY._20,
  },
  input: {
    backgroundColor: colors.neutral800,
    color: colors.white,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginVertical: 6,
  },
  typeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral800,
    marginRight: 8,
    marginBottom: 6,
  },
  iconBtn: {
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: colors.neutral800,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    flexWrap: "wrap",
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColorCircle: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
});
